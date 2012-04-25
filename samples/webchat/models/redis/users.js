/**
 * Model of users redis database
 */
var
util = require('util'),
client = null;

const
EXPIRY = 3600,
Q_SIZE = 5,
ERROR_INVALID = 'invalid session id',
F_NAME = 'n',
F_SESS = 's';

exports.setup = function(context, cb){
  client = context.redis_users.conn;
  cb();
}

function userKey(sessionId){ return 'u:'+sessionId;}
function queueKey(sessionId){ return 'q:'+sessionId;}

// write user session
exports.set = function(sessionId, name, life, cb){
  if (!sessionId) return cb(ERROR_INVALID);

  var key = userKey(sessionId);

  client.hmset(key, F_NAME, name, F_SESS, sessionId, function(err, res){
    client.expire(key, life || EXPIRY, function(err){
      return cb(err ? err.message : err, res);
    });
  });
}

// read user session
exports.get = function(sessionId, cb){
  if (!sessionId) return cb(ERROR_INVALID);
  client.hmget(userKey(sessionId), F_NAME, F_SESS, function(err, res){
    if (err) return cb(err.message);
    if (res[0]) return cb(null, {name:res[0], session:parseInt(res[1])});
    return cb(); // not found
  });
}

// broadcast message to users
exports.broadcast = function(msg, sessions, cb){
  if (sessions.length <= 0) return cb();

  var 
  multi = client.multi(),
  key = null;

  for(var i=0,j=sessions.length;i<j;++i){
    key = queueKey(sessions[i]);
    multi.lpush(key, msg).ltrim(key,0,Q_SIZE);
  }
  multi.exec(cb);
}
 
// a singular version of broadcast function (not in use)
exports.pushMsg = function(sessionId, data, cb){
  if (!sessionId) return cb(ERROR_INVALID);
  var key = queueKey(sessionId);

  client.lpush(key, data, function(err, res){
    if (err) return cb(err.message);
    client.ltrim(key, 0, Q_SIZE, function(err, res){
      return cb(err, res);
    });
  });
}

// get all messages from user's message queue
exports.popMsgs = function(sessionId, cb){
console.log('users.popMsgs sessionId[%d]', sessionId);
  if (!sessionId) return cb(ERROR_INVALID);
  var
    key = queueKey(sessionId);

  client.llen(key, function(err, len){
console.log('users.popMsgs len[%d]', len);
    if (err) return cb(err);
    if (len < 1) return cb(err, []);
    var multi = client.multi();
    while(len--){multi.rpop(key);}
    multi.exec(function(err, data){
console.log('users.popMsgs data[%s]', util.inspect(data));
      return cb(err, data);
    });
  });
}

// count message queue length
exports.countMsg = function(sessionId, cb){
  if (!sessionId) return cb(ERROR_INVALID);
  client.llen(queueKey(sessionId), function(err, len){
    return cb(err, len);
  });
}
