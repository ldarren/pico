/*
 * main module. read config, init module
 */
var
  fs = require('fs'),
  path = require('path'),
  util = require('util'),
  cluster = require('cluster');

function _loadModules(context, config, keys, cb){
  if (0 == keys.length) { cb(context); return; }
  var key = keys.shift(), value = config[key];
  require(__dirname+'/lib/'+key).init(value,function(err, module){
    context[value.id ? value.id : key] = module;
    _loadModules(context, config, keys, cb);
  });
}

function _loadElements(context, elements, cb){
  if (0 == elements.length) { cb(); return; }
  var element = elements.shift();
  element.setup(context,function(){
    _loadElements(context, elements, cb);
  });
}

exports.init = function(cfg, cb){
  if (cluster.isMaster){
    for(var i=0,j=require('os').cpus().length;i<j;++i){
      cluster.fork();
    }
    cluster.on('death', function(worker) {
      console.log('worker ' + worker.pid + ' died. restart...');
      cluster.fork();
    });
  }else{
    var web = http.createServer(process);
    web.listen(cfg.port, cfg.host, function(){
      console.log('Web @ http://' + (cfg.host || '127.0.0.1') + ':' + cfg.port.toString() + '/');
      web.setRoute = setRoute;
      cb(null, web);
    });
  }
}

exports.createContext = function (args, cb){
  if (cluster.isMaster){
    for(var i=0,j=require('os').cpus().length;i<j;++i){
      cluster.fork();
    }
    cluster.on('death', function(worker) {
      console.log('worker ' + worker.pid + ' died. restart...');
      cluster.fork();
    });
  }else{
    var 
      config = {},
      context = {};

    for(var i=0, j=args.length; i<j; ++i){
      switch(args[i]){
        case '-h':
        {
          console.log('usage: node index.js -c CONFIG_FILE');
          cb(context);
          //process.exit(0);
          break;
        }
        case '-c':
        {
          var cfg_file = args[++i];
          fs.readFile(cfg_file, function (err, data){
            if (err) throw err;
            config = JSON.parse(data);
            _loadModules(context, config, Object.keys(config), function(context){
              context.config = config;
              cb(context);
            });
          });
          break;
        }
      }
    }
  }
}

exports.run = function(context){
  var root = path.dirname(process.argv[1]);
  _loadElements(context, require(root+'/models').all, function(){
    //require.paths.push('../models/');
    _loadElements(context, require(root+'/actions').all, function(){
    });
  });
}
