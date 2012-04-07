/*
* @author: Darren Liew
* @date: 16/Feb/2012
*/
var
  redis = require('redis'),
  connect = function(cfg, cb){
    var
      host = cfg.host,
      port = cfg.port,
      db = cfg.db,
      options = cfg.options || {},
      conn = redis.createClient(port, host, options);

    if(!conn) {return cb("failed to connect redis");}

    conn.on('end', function(){
      console.log('redis @ %s:%d/%d disconnected',host,port,db);
    });

    conn.on('error', function(err){
      console.err('redis @ %s:%d/%d exception: %s',host,port,db,err);
    });

    conn.on('connect', function(){
      conn.select(db, function(err){
        console.log('redis @ %s:%d/%d connected',host,port,db);
        return cb(err, conn);
      });
    });
  }

exports.init = function (cfg, cb) {
  connect(cfg, cb);
};
