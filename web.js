var 
  http = require('http'),
  url = require('url'),
  qs = require('querystring'),
  formidable = require('formidable'),
  nox = require('noxmox');

var web = exports;

var 
  CONTENT_TYPE = 'Content-Type',
  CONTENT_LEN = 'Content-Length',
  ACCESS_CONTROL = 'Access-Control-Allow-Origin',
  NOT_FOUND = 'not found',
  NOT_IMPLEMENTED = 'not implemented';

var routes = {}

web.setRoute = function(path, route){
  routes[path] = route;
}

var server = http.createServer(function(req, res){

  res.render = function (code, obj){
      var body = new Buffer(JSON.stringify(obj));
        res.writeHead(code, {CONTENT_TYPE: 'application/json', ACCESS_CONTROL: '*', CONTENT_LEN: body.length});
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

});

web.listen = function(port, host){
  server.listen(port, host);
  console.log('Server at http://' + (host || '127.0.0.1') + ':' + port.toString() + '/');
}

web.close = function() { server.close(); }
