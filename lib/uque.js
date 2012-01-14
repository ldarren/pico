/*
 *@author: Darren Liew
 *@Date: 3 Jan 2012
 *@remarks: micro queue
 */
var
  Memcached = require('memcached'),
  util = require('util');

function uQue(cfg){
  this.mem = new Memcached(cfg.hosts, cfg.options);
  this.mem.on('failure', function( details ){ console.log( "Queue[" + details.server + "] went down due to: " + details.messages.join( '' ) ) });
  this.mem.on('reconnecting', function( details ){ console.log( "Total downtime queue[" + details.server + "] :" + details.totalDownTime + "ms")});

  this.config = {};
}

uQue.prototype.create = function(uuid, options, cb){
  this.config = {
    life: options.life || 10800,
    size: options.size || 64
    };
  this.reset(uuid, cb);
}

uQue.prototype.destroy = function(uuid, cb){
  this.mem.del(uuid+'in', cb);
}

uQue.prototype.reset = function(uuid, cb){
  var
    mem = this.mem,
    config = this.config;

  mem.set(uuid+'head', 0, config.life, function(err, result){
    if (err) {cb(err, result); return;}
    mem.set(uuid+'tail', 0, config.life, function(err, result){
      if (err) {cb(err, result); return;}
      mem.set(uuid+'in', 0, config.life, function(err, result){
        cb(err, 0);
      });
    });
  });
}

function _increIn(mem, keyIn, life, cb){
  mem.gets(keyIn, function(err, result){
    var value = parseInt(result[keyIn]);
    mem.cas(keyIn, value+1, result.cas, life, function(err, result){
      if (result) {cb(err, value); return;}
      _increIn(mem, keyIn, life, cb);
    });
  });
}

// check in key, if destroy, reset queue table
// @in uuid queue id
// @in cb callback function
// @return in pointer value
uQue.prototype.startWrite = function(uuid, cb){
  var
    mem = this.mem;

  _increIn(mem, uuid+'in', this.config.life, function(err, result){
    if (err) 
      mem.reset(uuid, function(err, result){
        cb(err, 0);
      });
    else
      cb(err, result);
  });
}

uQue.prototype.push = function(uuid, value, cb){
  var
    mem = this.mem,
    config = this.config,
    self = this;

  this.startWrite(uuid, function(err, result){
    var i = result > config.size ? 0 : result;
    mem.set(uuid+i, value, config.life, function(err, result){
      if (err) {cb(err,result); return;}
      self.length(uuid, function(err, len){
        if (len[0] < config.size){
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
  var
    mem = this.mem,
    config = this.config;

  this.length(uuid, function(err, len){
    if (len[2] > 0){
      mem.get(uuid+len[0], function(err, value){
        if (err) {cb(err,null);return;}
        if (len[0] == config.size){
          mem.set(uuid+'head', 0, config.life, function(err, result){
            cb(err, value);
          });
        }else{
          mem.increment(uuid+'head', 1, function(err, result){
            cb(err, value);
          });
        }
      });
    }else{
      cb(err,0);
    }
  });
}

uQue.prototype.popAll = function(uuid, cb){
  var
    mem = this.mem,
    config = this.config;

  this.length(uuid, function(err, len){
    if (len[2] > 0){
      var list = [], s = config.size;
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
  var
    mem = this.mem,
    config = this.config;

  mem.get(uuid+'tail', function(err, tail){
    mem.get(uuid+'head', function(err, head){
      if (err) {cb(err, 0);}
      if (tail > head) { cb(null, [head, tail, tail - head]); }
      else { cb(null, [head, tail, config.size - head + tail]); }
    });
  });
}

exports.init = function(cfg, cb){
  console.log('uQueue @ '+cfg.hosts);
  cb(null, new uQue(cfg));
}
