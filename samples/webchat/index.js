var
  pico = require('./../../../pico');

pico.createContext(process.argv, function(err, context){
  if (err) return console.log(err);
  var web = context.web;
  web.setDefaultPipeline([web.makeJSON,web.makeHTTP]);
  pico.setup(context, function(err, elements){
    if (err) return console.log(err);
  });
});

