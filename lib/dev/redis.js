/*
* @author: Darren Liew
* @date: 16/Feb/2012
*/
var
  redis = require('redis');

function RedisDB(cfg){
  this.host = cfg.host;
  this.port = cfg.port;
  this.db = cfg.db || 0;
  this.options = cfg.options || {};
}

RedisDB.prototype.connect = function(cb){
  var
    host = this.host,
    port = this.port,
    db = this.db,
    options = this.options,
    conn = redis.createClient(port, host, options);

  if (null === conn) {return cb("failed to create redis conn");}
  this.conn = conn;

  conn.on('end', this.onClose);
  conn.on('error', this.onError);
  conn.on('connect', function(){
    conn.select(db, function(err){
      console.log('redis @ %s:%d/%d connected', host, port, db);
      return cb(err);
    });
  });
}

RedisDB.prototype.onClose = function(){
  console.log('redis @ %s:%d/%d disconnected', this.host, this.port, this.db);
  this.connect(function(){
  });
}

RedisDB.prototype.onError = function assert(err){
  console.error('redis @ %s:%d/%d exception: %s', this.host, this.port, this.db, err);
}

exports.init = function (cfg, cb) {
  var rdb = new RedisDB(cfg);

  rdb.connect(function(err){
    return cb(err, rdb);
  });
};
