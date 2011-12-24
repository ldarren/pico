/*
 * main module. read config, init module
 */
var
  fs = require('fs');

function loadModules(context, config, keys, done){
  if (0 == keys.length) { done(context); return; }
  var key = keys.shift();
  require(__dirname+'/lib/'+key).init(config[key],function(err, module){
    context[key] = module;
    loadModules(context, config, keys, done);
  });
}

exports.createContext = function (args, done){
  var context = {};
  var config = {};
  for(var i=0, j=args.length; i<j; ++i){
    switch(args[i]){
      case '-h':
      {
        console.log('usage: node index.js -c CONFIG_FILE');
        done(context);
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
            done(context);
          });
        });
        break;
      }
    }
  }
};
