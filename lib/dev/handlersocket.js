/*
* @author: Darren Liew
* @date: 6/Mar/2012
*/
var 
hs = require('node-handlersocket');

exports.init = function (cfg, cb) {
  var conn = hs.connect({host:cfg.host,port:cfg.port,auth:cfg.auth}, function(){
    console.log('handlersocket @ %s:%d/',cfg.host,cfg.port);
    cb(null, conn);
  });
};

