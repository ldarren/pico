/*
 *@author: Darren Liew
 *@Date: 3 Jan 2012
 *@remarks: micro queue
 */
var
  Memcached = require('memcached');

function uQue(cfg){
  var
    mem = new Memcached(cfg.hosts, cfg.options);
  mem.on('failure', function( details ){ console.log( "Queue[" + details.server + "] went down due to: " + details.messages.join( '' ) ) });
  mem.on('reconnecting', function( details ){ console.log( "Total downtime queue[" + details.server + "] :" + details.totalDownTime + "ms")});
}

uQue.prototype.create = function(uuid, options, cb){
  this.config = {
    life: options.life || 10800,
    size: options.size || 64
    };
  this.clear(uuid, cb);
}

uQue.prototype.destroy = function(uuid, cb){
  mem.del(uuid+'head', cb);
}

uQue.prototype.clear = function(uuid, cb){
  mem.set(uuid+'head', 0, this.config.life, function(err, result){
    if (err) {cb(err, result); return;}
    mem.set(uuid+'tail', 0, this.config.life, function(err, result){
      if (err) {cb(err, result); return;}
      mem.set(uuid+'in', 0, this.config.life, function(err, result){
        cb(err, uuid);
      });
    });
  });
}

uQue.prototype.push = function(uuid, value, cb){
  mem.increment(uuid+'in', 1, function(err, result){
    var i = result > this.config.size ? 0 : result;
    mem.set(uuid+i, value, this.config.life, function(err, result){
      if (err) {cb(err,result); return;}
      this.length(uuid, function(err, length){
        if (length < this.config.size){
          mem.increment(uuid+'tail', 1, cb);
        }else{
          mem.increment(uuid+'head', 1, function(err, result){
            mem.increment(uuid+'tail', 1, cb);
          });
        }
      });
    });
  });
}

uQue.prototype.pop = function(uuid, cb){
  this.length(uuid, function(err, len){
    if (len[2] > 0){
      mem.get(uuid+len[0], function(err, value){
        if (err) {cb(err,null);return;}
        if (len[0] == this.config.size){
          mem.set(uuid+'head', 0, this.config.life, function(err, result){
            cb(err, value);
          });
        }else{
          mem.increment(uuid+'head', 1, function(err, result){
            cb(err, value);
          });
        }
      });
    }
  });
}

uQue.prototype.popAll = function(uuid, cb){
  this.length(uuid, function(err, len){
    if (len[2] > 0){
      var list = [], s = this.config.size;
      for(var h=len[0], t=len[1]; h!=t; ++h){
        if (h > s) h = 0
        list.push(uuid+h);
      }
      mem.get(list, function(err, values){
        if (err) {cb(err,null);return;}
        mem.set(uuid+'head', len[1], function(err, result){
          cb(err, values);
        });
      });
    }
  });
}

uQue.prototype.length = function(uuid, cb){
  mem.get(uuid+'tail', function(err, tail){
    mem.get(uuid+'head', function(err, head){
      if (tail > head) { cb(null, [head, tail, tail - head]); }
      else { cb(null, [head, tail, this.config.size - head + tail]); }
    });
  });
}

exports.init = function(cfg, cb){
  cb(null, new uQue(cfg));
}
