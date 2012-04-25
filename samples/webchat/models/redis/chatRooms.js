/**
 * Model for redis chat room database
 * this model keep track active chatroom's users and storing message history
 */
var
  hash = require('mhash').hash,
  client = null;

const
  EXPIRY_ACTIVE = 60 * 10, // keep record for 10 mins, only 5 min data are needed
  EXPIRY_MSG = 60 * 60 * 24 * 1;

exports.setup = function(context, cb){
  client = context.redis_rooms.conn;
  return cb();
};

function key(roomId){ return roomId+':'+(new Date).getMinutes();}

function keys(roomId){
  var
  keys = [],
  m = (new Date).getMinutes();

  for (var i=0; i<5; ++i){ keys.push(roomId+':'+((60+m-i)%60)); }
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
  client.multi()
  .sadd(k, JSON.stringify(userInfo))
  .expire(k, EXPIRY_ACTIVE)
  .exec(cb);
}

/**
 * get current active users in a chatroom
 * @param roomId room identifier
 * @return 
 */
exports.getActives = function(roomId, cb){
  client.sunion(keys(roomId), cb);
}

/**
 * set chatroom message
 * @param roomId room identifier
 * @param msg text message
 * @return 
 */
exports.setMsg = function(roomId, msg, cb){
  var key = hash('md5', msg+roomId);
  client.setex(key, EXPIRY_MSG, msg, function(err){
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
  multi.exec(cb);
}

/**
 * get chatroom message, singular version of getMsgs
 * @param key Text message's key, which contains roomId 
 * @return 
 */
exports.getMsg = function(key, cb){
  client.get(key, cb);
}
