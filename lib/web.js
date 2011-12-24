var 
  http = require('http'),
  url = require('url'),
  qs = require('querystring'),
  formidable = require('formidable'),

  NOT_FOUND = 'not found',
  NOT_IMPLEMENTED = 'not implemented',

  routes = {};

function setRoute(path, route){
  routes[path] = route;
}

function process(req, res){

  res.render = function (code, obj){
      var body = new Buffer(JSON.stringify(obj));
      res.writeHead(code, {
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*', 
        'Content-Length': body.length});
      req.method == 'HEAD' ? res.end() : res.end(body);
  };

  var uri = url.parse(req.url).pathname;

  var route = routes[uri] || function(req, res){
    res.render(404, {msg: NOT_FOUND});
  };
    
  switch (req.method){
  case 'HEAD':
  case 'GET':
    req.GET = url.parse(req.url, true).query;
    route(req, res);
    break;
  case 'POST':
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files){
      req.POST = fields;
      req.FILES = files;
      route(req, res);
    });
    break;
  default:
    res.render(501, {msg: NOT_IMPLEMENTED});
    break;
  }

}

exports.init = function(cfg, done){
  var web = http.createServer(process);
  web.listen(cfg.port, cfg.host, function(){
    console.log('Web @ http://' + (cfg.host || '127.0.0.1') + ':' + cfg.port.toString() + '/');
    web.setRoute = setRoute;
    done(null, web);
  });
}

