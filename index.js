/*
 * main module. read config, init module
 */
var
  path = require('path'),
  util = require('util'),
  cluster = require('cluster');
  BaseError = require('./lib/errors/base');

function _loadModules(context, config, keys, cb){
  if (0 == keys.length) { cb(null, context); return; }
  var key = keys.pop(), val = config[key];
  require(__dirname+'/lib/dev/'+val.mod).init(val,function(err, module){
    context[key] = module;
    _loadModules(context, config, keys, cb);
  });
}

function _loadElements(context, elements, cb){
  if (0 == elements.length) { cb(null, null); return; }
  var element = elements.pop();
  element.setup(context,function(){
    _loadElements(context, elements, cb);
  });
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
      config = null,
      error = null,
      context = {homeDir:path.dirname(args[1])+'/', BaseError:BaseError};

    process.on('uncaughtException', function(err){
      console.log("PICO Uncaught Exception:\n %s", err.stack);
    });

    for(var i=0, j=args.length; i<j; ++i){
      switch(args[i]){
        case '-h':
        {
          console.log('usage: node index.js -c CONFIG_FILE');
          //process.exit(0);
          break;
        }
        case '-c':
        {
          var
            cfgFile = args[++i];
          config = require(context.homeDir+cfgFile);
          _loadModules(context, config.lib, Object.keys(config.lib), function(err, context){
            error = err;
            context.config = config;
            return cb(error, context);
          });
          break;
        }
      }
    }
    if (null == config){
      error = 'usage: node index.js -c CONFIG_FILE';
      return cb(error, context);
    }
  }
}

exports.setup = function(context, cb){
  var root = context.homeDir;
  _loadElements(context, require(root+'/models'), function(err, elements){
    if (err) return cb(err, elements);
    _loadElements(context, require(root+'/actions'), function(err, elements){
      if (err) return cb(err, elements);
    });
  });
}
