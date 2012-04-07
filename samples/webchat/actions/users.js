var
  util = require('util'),
  userSessions = null,
  chatRooms = null;

const
  ROOM_ID = 'rm';

function makeName (req, res, product, cb){
  product.body = 'pl.hat';
  cb(null, product);
}

function validUserCreate(req, res, product, cb){
  if (!product.params.name)
    return cb({code:403,head:{}, body:{msg:'No enough parameters'}}, null);
  return cb(null, product);
}

function validUsersAuth(req, res, product, cb){
  if (!product.params.session)
    return cb({code:403,head:{}, body:{msg:'No enough parameters'}}, null);
  product.params.session = parseInt(product.params.session);
  return cb(null, product);
}

function validUsersSend(req, res, product, cb){
  if (!product.params.session || !product.params.msg)
    return cb({code:403,head:{}, body:{msg:'No enough parameters'}}, null);
  product.params.session = parseInt(product.params.session);
  return cb(null, product);
}

function getSession(req, res, product, cb){
  userSessions.get(product.params.session, function(err, reply){
    if (err) return cb({code:500,head:{},body:{msg:err}}, null);

    if (reply){
      product['session'] = reply;
console.log('getSession: '+util.inspect(product));
      return cb(null, product);
    }
    return cb({code:401,head:{},body:{msg:'unauthorize'}}, null);
  });
}

function setSession(req, res, product, cb){
  var
    s = product.session;
  userSessions.set(s.session, s.name, 3600, function(err, reply){
    if (err) return cb({code:500,head:{},body:{msg:err.message}}, null);
    return cb(null, product);
  });
}

function setActive(req, res, product, cb){
console.log('setActive: session: '+util.inspect(product.session));
  if (!product.session) return cb(null, product);
  chatRooms.setActive(ROOM_ID, product.session, function(err, reply){
    if (err) return cb({code:500,head:{},body:{msg:err.message}}, null);
console.log('setActive: '+util.inspect(reply));
    return cb(null, product);
  });
}

function getUserList(req, res, product, cb){
  chatRooms.getActives(ROOM_ID, function(err, reply){
    if (err) return cb({code:500,head:{},body:{msg:err.message}}, null);
    product.body['list'] = reply;

console.log('getUserList: '+util.inspect(product));
    return cb(null, product);
  });
}

function broadcast(req, res, product, cb){
  var 
    p = product.params,
    s = product.session;
  chatRooms.setMsg(ROOM_ID, JSON.stringify({name:s.name, msg:p.msg}), function(err, key){
    chatRooms.getActives(ROOM_ID, function(err, list){
      if (err) return cb({code:500,head:{},body:{msg:err.message}}, null);
      if (list.length <= 0) return cb(null, product);
      var 
        user=null,
        users=[];
      for (var i=0, j=list.length; i<j; ++i){
        user = JSON.parse(list[i]);
        if (s.session == user.session) continue;
        users.push(parseInt(user.session));
      }
      userSessions.broadcast(key, users, function(err){
        return cb(err, product);
      });
    });
  });
}

function getBuffer(req, res, product, cb){
  userSessions.popMsgs(product.session.session, function(err, ids){
    if (err) return cb({code:500,head:{},body:{msg:err.message}}, null);
console.log('getBuffer.ids: '+util.inspect(ids));
    chatRooms.getMsgs(ids, function(err, msgs){
      if (err) return cb({code:500,head:{},body:{msg:err.message}}, null);
console.log('getBuffer.msgs: '+util.inspect(msgs));
      product.params['msgs'] = msgs;
      return cb(null, product);
    });
  });
}

function makeNewUser(req, res, product, cb){
  product.body = {name:product.params.name, session:Math.floor((Math.random()*400000))};
  product.session = product.body;
  cb(null, product);
}

function makeAuth(req, res, product, cb){
  product.body = {name:product.session.name};
  console.log('makeAuth [%s]', util.inspect(product.body));
  cb(null, product);
}

function makeEchoMsg(req, res, product, cb){
  console.log('makeEchoMsg1: '+util.inspect(product));
  var msgs = product.params.msgs || [];
  msgs = msgs.reverse();
  msgs.push(JSON.stringify({name:product.session.name, msg:product.params.msg}));
  product.body['msgs'] = msgs;
  console.log('makeEchoMsg2: '+util.inspect(product));
  cb(null, product);
}

exports.setup = function(context, cb){
  var
  pl = context.pipeline;

  userSessions = require('../models/redis/users');
  chatRooms = require('../models/redis/chatRooms');

  pl.setGETRoute('/who', [makeName]);
  
  pl.setPOSTRoute('/users/create', [pl.makeParams, validUserCreate, makeNewUser, setSession, setActive]);
  pl.setPOSTRoute('/users/auth', [pl.makeParams, validUsersAuth, getSession, setActive, makeAuth]);
  pl.setPOSTRoute('/users/chat', [pl.makeParams, validUsersSend, getSession, setActive, broadcast, getBuffer, makeEchoMsg]);
  pl.setGETRoute('/users/list', [pl.makeParams, validUsersAuth, getSession, getUserList]);

  cb();
}
