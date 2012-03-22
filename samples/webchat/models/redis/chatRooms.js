/**
 * Model for redis chat room database
 * this model keep track active chatroom's users and storing message history
 */
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

/**
 * set user status to active
 * @param roomId room identifier
 * @param userInfo An json object contains username and user's sessionid
 * @return 
 */
exports.setActive = function(roomId, userInfo, cb){
  var k = key(roomId);
  client.sadd(k, JSON.stringify(userInfo), function(err, res){
    if(err) return cb(err);
    client.expire(k, expiryActive, function(err, res){
      return cb(err, res);
    });
  });
}

/**
 * get current active users in a chatroom
 * @param roomId room identifier
 * @return 
 */
exports.getActives = function(roomId, cb){
  client.sunion(keys(roomId), function(err, res){
    return cb(err, res);
  });
}

/**
 * set chatroom message
 * @param roomId room identifier
 * @param msg text message
 * @return 
 */
exports.setMsg = function(roomId, msg, cb){
  var key = hash('md5', msg+roomId);
  client.setex(key, expireMsg, msg, function(err){
    return cb(err, key);
  });
}

/**
 * get chatroom messages
 * @param keys Text messages' key, which contains roomId 
 * @return 
 */
exports.getMsgs = function(keys, cb){
  var l = keys.length;
  if (l <= 0) return cb();
  var multi = client.multi();
  while(l--){ multi.get(keys[l]); }
  multi.exec(function(err, msgs){
    return cb(err, msgs);
  });
}

/**
 * get chatroom message, singular version of getMsgs
 * @param key Text message's key, which contains roomId 
 * @return 
 */
exports.getMsg = function(key, cb){
  client.get(key, function(err, msg){
    return cb(err, msg);
  });
}
