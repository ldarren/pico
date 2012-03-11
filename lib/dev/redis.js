/*
* @author: Darren Liew
* @date: 16/Feb/2012
*/
var
redis = require('redis');


exports.init = function (cfg, cb) {
  var client = redis.createClient(cfg.port, cfg.host, {});
  if (null === client) {return cb("failed to create redis client", null);}

  console.log('redis @ %s:%d/',cfg.host,cfg.port);
  cb(null, client);
};
