var 
  mongo = require('mongodb'),
  options = {nativeParser: true};

exports.init = function (cfg, done) {
  new mongo.Db(cfg.database, new mongo.Server(cfg.host, cfg.port, options)).open(function(err, mdb){
    if (err) {done(err, null); return;};
    console.log('Mongodb @ '+cfg.host+':'+cfg.port+'.'+cfg.database);
    done(null, mdb);
  });
};
