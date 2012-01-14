/*
 *@author: Darren Liew
 *@Date: 3 Jan 2012
 *@remarks: memcached
 */
var
  Memcached = require('memcached');

exports.init = function(cfg, cb){
  memcached = new Memcached(cfg.hosts, cfg.options);
  memcached.on('failure', function( details ){ console.log( "Memcached[" + details.server + "] went down due to: " + details.messages.join( '' ) ) });
  memcached.on('reconnecting', function( details ){ console.log( "Total downtime memcached[" + details.server + "] :" + details.totalDownTime + "ms")});

  console.log('memcached @ '+cfg.hosts);
  cb(null, memcached);
};
