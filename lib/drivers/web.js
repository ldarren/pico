var 
util = require('util'),
http = require('http'),
pipeline = require('./pipeline');

exports.init = function(app, cfg, cb){
  var web = http.createServer(pipeline.addHTTPClient);
  web.listen(cfg.port, cfg.host, function(){
    console.log('Web @ http://%s:%d/',(cfg.host || '127.0.0.1'),cfg.port);

    cb(null, web);
  });
}
