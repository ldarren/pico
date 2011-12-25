/*
 * main module. read config, init module
 */
var
  fs = require('fs');

function loadModules(context, config, keys, cb){
  if (0 == keys.length) { cb(context); return; }
  var key = keys.shift(), value = config[key];
  require(__dirname+'/lib/'+key).init(value,function(err, module){
    context[value.id ? value.id : key] = module;
    loadModules(context, config, keys, cb);
  });
}

exports.createContext = function (args, cb){
  var context = {};
  var config = {};
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
          loadModules(context, config, Object.keys(config), function(context){
            context.config = config;
            cb(context);
          });
        });
        break;
      }
    }
  }
};
