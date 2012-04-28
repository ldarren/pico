/*
* @author: Darren Liew
* @date: 16/Feb/2012
*/
const
ERROR_NETWORK = "failed to connect redis",
EVT_CONNECT = 'connect',
EVT_DISCONNECT = 'end',
EVT_ERROR = 'error',
MSG_DISCONNECT = 'redis @ %s:%d/%d disconnected',
MSG_ERROR = 'redis @ %s:%d/%d error[%s]',
MSG_CONNECT = 'redis @ %s:%d/%d connected';

var
util = require('util'),
redis = require('redis'),
Redis = function(cfg, cb){
  var
  me = this;
  host = me.host = cfg.host,
  port = me.port = cfg.port,
  db = me.db = cfg.db,
  options = cfg.options || {},
  conn = me.conn = redis.createClient(port, host, options);

  if(!conn) return cb(ERROR_NETWORK);

  conn.on(EVT_CONNECT, function(){
    conn.select(db, function(err){
      console.log(MSG_CONNECT,host,port,db);
      if (cb) cb(err, me);
      cb = undefined; // call once only
    });
  });
  conn.on(EVT_DISCONNECT, function(){
    console.log(MSG_DISCONNECT,host,port,db);
  });
  conn.on(EVT_ERROR, function(err){
    console.err(MSG_ERROR,host,port,db,err);
  });
};

exports.init = function (app, cfg, cb) {
  new Redis(cfg, cb);
}
