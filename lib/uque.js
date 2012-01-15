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
  this.mem.del(uuid+'tail', cb);
}

uQue.prototype.reset = function(uuid, cb){
  var
    mem = this.mem,
    config = this.config;

  mem.set(uuid+'head', 0, config.life, function(err, result){
    if (err) {cb(err, result); return;}
    mem.set(uuid+'tail', 0, config.life, function(err, result){
      if (err) {cb(err, result); return;}
      cb(err, 0);
    });
  });
}

function _getInt(mem, id, cb){
  mem.get(id, function(err, result){ cb(err, parseInt(result)); });
}

function _inc(mem, key, config, cb){
  mem.gets(key, function(err, result){
    var
      idx = parseInt(result[key]),
      newIdx = idx + 1;
    if (newIdx === config.size) newIdx = 0;
    mem.cas(key, newIdx, result.cas, config.life, function(err, result){
      if (result) {cb(err, idx); return;}
      _inc(mem, key, config, cb);
    });
  });
}

// check in key, if destroy, reset queue table
// @in uuid queue id
// @in cb callback function
// @return in pointer value
function _getPushRight(mem, uuid, config, cb){
  _inc(mem, uuid+'tail', config, function(err, idx){
    if (err) 
      mem.reset(uuid, function(err, result){ cb(err, 0); });
    else
      cb(err, idx);
  });
}

uQue.prototype.push = function(uuid, value, cb){
  var
    mem = this.mem,
    config = this.config,
    self = this;

  _getPushRight(mem, uuid, config, function(err, i){
    mem.set(uuid+i, value, config.life, function(err, result){
      if (err) {cb(err,result); return;}
      self.length(uuid, function(err, len){
        if (len[1] === len[0]){ //if tail == head, move head
          _inc(mem, uuid+'head', config, function(err, result){
            self.length(uuid, function(err, len){
              cb(err, len[2]);
            });
          });
        }else{
          cb(err, len[2]);
        }
      });
    });
  });
}

// alwasy get one less
uQue.prototype.pop = function(uuid, cb){
  var
    mem = this.mem,
    config = this.config;

  this.length(uuid, function(err, len){
    if (len[2] > 0){
      mem.get(uuid+len[0], function(err, value){
        if (err) {cb(err,null);return;}
        _inc(mem, uuid+'head', config, function(err, result){
          cb(err, value);
        });
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
        if (h > s) h = 0;
        if (h == t) break;
        list.push(uuid+h);
      }
      mem.get(list, function(err, values){
        if (err) {cb(err,null);return;}
        mem.set(uuid+'head', len[1], config.life, function(err, result){
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

  _getInt(mem, uuid+'tail', function(err, tail){
    _getInt(mem, uuid+'head', function(err, head){
      if (err) {cb(err, -1);}
      if (tail >= head) { cb(null, [head, tail, tail - head]); }
      else { cb(null, [head, tail, config.size - head + tail]); }
    });
  });
}

exports.init = function(cfg, cb){
  console.log('uQueue @ '+cfg.hosts);
  cb(null, new uQue(cfg));
}
