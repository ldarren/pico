/*
* @author: Darren Liew
* @date: 6/Mar/2012
*/
const
EVT_CLOSE = 'close',
EVT_ERROR = 'error',
EVT_RECONNECT = 'reconnect',
MSG_CLOSE = 'handlersocket closed @ %s:%d/',
MSG_RECONNECT = 'handlersocket reconnected @ %s:%d/',
MSG_ERROR = 'handlersocket  @ %s:%d/ error[%s]',
MSG_CONNECT = 'handlersocket connected @ %s:%d/';

var 
hs = require('node-handlersocket'),
EventEmitter = require('events').EventEmitter,
HandlerSocket = function(cfg){
    this.cfg = {host:cfg.host,port:cfg.port,auth:cfg.auth};
    this.evt = new EventEmitter();
},
connect = function(me, cb){
    var
    cfg = me.cfg,
    evt = me.evt;
    conn = hs.connect(cfg, function(){
        conn.on(EVT_CLOSE, function(){
            console.log(MSG_CLOSE,cfg.host,cfg.port);
            connect(me, function(err, conn){
                console.log(MSG_RECONNECT,cfg.host, cfg.port);
                evt.emit(EVT_RECONNECT);
            });
        });

        conn.on(EVT_ERROR, function(err){
            console.log(MSG_ERROR,cfg.host,cfg.port,err);
            connect(me, function(err, conn){
                console.log(MSG_RECONNECT,cfg.host,cfg.port);
                evt.emit(EVT_RECONNECT);
            });
        });

        console.log(MSG_CONNECT, cfg.host,cfg.port);
        me.conn = conn;

        return cb(null, conn);
    });
};

exports.init = function (app, cfg, cb) {
    var client = new HandlerSocket(cfg);
    connect(client, function(err, conn){
        return cb(null, client);
    });
};
