var
  s3 = require('noxmox'),
  fs = require('fs');

exports.init = function (cfg, done){
  var storage = s3.nox.createClient({
    key: cfg.key,
    secret: cfg.secret,
    bucket: cfg.bucket});

  storage.upload = function (fo, done){
    fs.readFile(fo.path, function(err, data){
      var req = storage.put(fo.name, {'Content-Length': fo.size});

      req.on('continue', function(){
        req.end(data);
      });

      req.on('error', function(err) {
        done(err.message || err, null);
      });

      req.on('response', function(res){
        res.on('data', function(chunk){
          console.log(chunk);
        });

        res.on('end', function(){
          if (res.statusCode === 200){
            done(null, fo.name);
          }
        });
      });
    });
  }
  console.log('Storage @ '+cfg.bucket);
  done(null, storage);
}
