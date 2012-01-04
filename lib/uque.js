/*
 *@author: Darren Liew
 *@Date: 3 Jan 2012
 *@remarks: micro queue
 */
var
  Memcached = require('memcached');

function uQue(cfg){
  var mem = new Memcached(cfg.hosts, cfg.options);
  mem.on('failure', function( details ){ console.log( "Queue[" + details.server + "] went down due to: " + details.messages.join( '' ) ) });
  mem.on('reconnecting', function( details ){ console.log( "Total downtime queue[" + details.server + "] :" + details.totalDownTime + "ms")});
}

uQue.prototype.create = function(uuid, options, cb){
}

uQue.prototype.destroy = function(q, cb){
}

uQue.prototype.clear = function(q, cb){
}

uQue.prototype.push = function(q, cb){
}

uQue.prototype.pop = function(q, cb){
}

uQue.prototype.popAll = function(q, cb){
}

exports.init = function(cfg, cb){
  var que = new uQue(cfg);

  cb(null, que);
};
