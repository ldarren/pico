var 
  http = require('http'),
  url = require('url'),
  qs = require('querystring'),
  formidable = require('formidable'),
  zlib = require('zlib'),
  cluster = require('cluster'),

  NOT_FOUND = 'not found',
  NOT_IMPLEMENTED = 'not implemented',

  routes = {};

function setRoute(path, route){
  routes[path] = route;
}

function process(req, res){

  var
    uri = url.parse(req.url).pathname,
    route = routes[uri] || function(req, res){
      res.render(404, {msg: NOT_FOUND});
    },
    _fieldMap, _fileMap;

  res.render = function (code, obj){
      var 
        json = JSON.stringify(obj),
        write = function(buf){
          res.writeHead(code, {
            'Content-Type': 'application/json',
            'Content-Length': buf.length,
            'Access-Control-Allow-Origin': '*'
          });
          res.end(buf);
        };
      if (json.length > 255){
        zlib.deflate(json, function(err, buf){
          res.setHeader('Content-Encoding', 'deflate');
          write(buf);
        });
      }else{
        write(new Buffer(json));
      }
  };
  
  req.parseParams = function(cb){
    if (!_fieldMap && !_fileMap){
      if (req.method === 'POST'){
        new formidable.IncomingForm().parse(req, function(err, fields, files){
          _postMap = fields;
          _fileMap = files;
          cb(_postMap, _fileMap);
        });
      }else{
        _fieldMap = url.parse(req.url, true).query;
        cb(_fieldMap, _fileMap);
      }
    }else{
      cb(_fieldMap, _fileMap);
    }
  }

  route(req, res);
}

exports.init = function(cfg, cb){
  if (cluster.isMaster){
    for(var i=0,j=require('os').cpus().length;i<j;++i){
      cluster.fork();
    }
    cluster.on('death', function(worker) {
      console.log('worker ' + worker.pid + ' died. restart...');
      cluster.fork();
    });
  }else{
    var web = http.createServer(process);
    web.listen(cfg.port, cfg.host, function(){
      console.log('Web @ http://' + (cfg.host || '127.0.0.1') + ':' + cfg.port.toString() + '/');
      web.setRoute = setRoute;
      cb(null, web);
    });
  }
}

