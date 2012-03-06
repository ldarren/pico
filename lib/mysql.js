/*
* @author: Darren Liew
* @date: 28/Feb/2012
*/
var
mysql = require('mysql');


exports.init = function (cfg, cb) {
  var client = new mysql.createClient({
    user: cfg.user,  
    password: cfg.password,
    host: cfg.host,
    port: cfg.port,
    database: cfg.database});
  if (null == client)
    return cb("failed to create mysql client", client);

    console.log('mysql @ %s:%d/%s',cfg.host,cfg.port,cfg.database);
    cb(null, client);
};
