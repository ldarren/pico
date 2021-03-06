/*
 * @author: Darren Liew
 * @date: 26/Dec/2011
 */
var mongo = require('mongodb');

exports.init = function (app, cfg, cb) {
  new mongo.Db(cfg.database, new mongo.Server(cfg.host, cfg.port, cfg.options), cfg.options).open(function(err, mdb){
    if (err) {cb(err, null); return;}

    console.log('Mongodb @ %s:%d/%s', cfg.host, cfg.port, cfg.database);
    cb(null, mdb);
  });
};
