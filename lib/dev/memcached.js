/*
 *@author: Darren Liew
 *@Date: 3 Jan 2012
 *@remarks: memcached
 */
const
EVT_ERROR = 'failure',
EVT_RECONNECT = 'reconnecting',
MSG_ERROR = 'Memcached[%s] disconnected, error[%s]',
MSG_RECONNECT = 'Total downtime memcached[%s] : %dms',
MSG_CONNECT = 'memcached @ %s';
var
Memcached = require('memcached');

exports.init = function(app, cfg, cb){
  memcached = new Memcached(cfg.hosts, cfg.options);
  memcached.on(EVT_ERROR, function( details ){
    console.log( MSG_ERROR, details.server, details.messages.join( '' ) );
  });
  memcached.on(EVT_RECONNECT, function( details ){
    console.log( MSG_RECONNECT, details.server, details.totalDownTime);
  });

  console.log(MSG_CONNECT,cfg.hosts);
  cb(null, memcached);
};
