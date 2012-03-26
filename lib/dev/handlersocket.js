/*
* @author: Darren Liew
* @date: 6/Mar/2012
*/
var
hs = require('node-handlersocket'),
EventEmitter = require('events').EventEmitter;

function HandlerDB(cfg){
  this.cfg = {host:cfg.host,port:cfg.port,auth:cfg.auth};
  this.emitter = new EventEmitter();
}

function connect(cfg, cb){
  var conn = hs.connect(cfg, function(){
    return cb(null, conn);
  });
}

HandlerDB.prototype.connect = function(cb){
  var
  me = this,
  cfg = me.cfg,
  emitter = me.emitter;

  connect(cfg, function(err, conn){

    conn.on('close', function(){
      console.log('handlersocket closed @ %s:%d/',cfg.host,cfg.port);
      connect(cfg, function(err, conn){
        console.log('handlersocket reconnected @ %s:%d/',cfg.host,cfg.port);
        me.conn = conn;
        emitter.emit('reconnect');
      });
    });

    conn.on('error', function(err){
      console.error('handlersocket  @ %s:%d/ error[%s]',cfg.host,cfg.port,err);
      connect(cfg, function(err, conn){
        console.log('handlersocket reconnected @ %s:%d/',cfg.host,cfg.port);
        me.conn = conn;
        emitter.emit('reconnect');
      });
    });

    console.log('handlersocket connected @ %s:%d/',cfg.host,cfg.port);
    me.conn = conn;
    cb(null, conn);
  });
}

exports.init = function (cfg, cb) {
  var client = new HandlerDB(cfg);
  client.connect(function(err, conn){
    cb(null, client);
  });
};

