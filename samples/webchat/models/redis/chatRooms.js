var
  hash = require('mhash').hash,
  client = null,
  expiryActive = 600, // keep record for 10 mins, only 5 min data are needed
  expireMsg = 86400;

exports.setup = function(context, cb){
  client = context.redis_rooms;

  cb();
};

function key(roomId){
  return roomId+':'+(new Date).getMinutes();
}

function keys(roomId){
  var
    keys = [],
    m = (new Date).getMinutes();

  for (var i=0; i<5; ++i){
    keys.push(roomId+':'+((m-i)%60));
  }
  return keys;
}

exports.setActive = function(roomId, userInfo, cb){
  var k = key(roomId);
  client.sadd(k, JSON.stringify(userInfo), function(err, res){
    if(err) return cb(err);
    client.expire(k, expiryActive, function(err, res){
      return cb(err, res);
    });
  });
}

exports.getActives = function(roomId, cb){
  client.sunion(keys(roomId), function(err, res){
    return cb(err, res);
  });
}

exports.setMsg = function(roomId, msg, cb){
  var key = hash('md5', msg+roomId);
  client.setex(key, expireMsg, msg, function(err){
    return cb(err, key);
  });
}

exports.getMsg = function(key, cb){
  client.get(key, function(err, msg){
    return cb(err, msg);
  });
}

exports.getMsgs = function(keys, cb){
  var l = keys.length;
  if (l <= 0) return cb();
  var multi = client.multi();
  while(l--){ multi.get(keys[l]); }
  multi.exec(function(err, msgs){
    return cb(err, msgs);
  });
}
