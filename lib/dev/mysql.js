/*
* @author: Darren Liew
* @date: 28/Feb/2012
*/
const
ERR_NETWORK = 'failed to create mysql client',
MSG_CONNECT = 'mysql @ %s:%d/%s';

var
mysql = require('mysql');

exports.init = function (app, cfg, cb) {
  var
  client = new mysql.createClient({
    user: cfg.user,  
    password: cfg.password,
    host: cfg.host,
    port: cfg.port,
    database: cfg.database});
  if (!client) return cb(ERR_NETWORK);

  console.log(MSG_CONNECT,cfg.host,cfg.port,cfg.database);
  cb(null, client);
};
