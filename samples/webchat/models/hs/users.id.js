var
  rindex = null,
  rwindex = null,
  headers = ['user_id', 'uuid', 'name', 'ver'],
  util = require('util');

exports.setup = function(context, cb){
  context.hs_read.openIndex('mf_game', 'users', 'euid',
  headers, function(err, index){
    rindex = index;
    context.hs_write.openIndex('mf_game', 'users', 'euid',
    ['user_id', 'uuid', 'name', 'ver'], function(err, index){
      rwindex = index;
      return cb(null);
    });
  });
}

exports.headers = headers;

exports.findUser = function(euid, cb){
  rindex.find('=', [euid], function(err, records){
    return cb(err, records);
  });
}

