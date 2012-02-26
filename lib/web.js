var 
  http = require('http'),
  url = require('url'),
  qs = require('querystring'),
  formidable = require('formidable'),
  zlib = require('zlib'),

  routes = {};

const
  NOT_FOUND = 'not found',
  NOT_IMPLEMENTED = 'not implemented';

function setRoute(path, route){
  routes[path] = route;
}

function process(req, res){
  var
    uri = url.parse(req.url).pathname,
    route = routes[uri] || function(req, res){
      res.render(404, {msg: NOT_FOUND});
    },
    _fieldMap, _fileMap;

  res.render = function (obj, code){
    var
      code = code || 200,
      json = JSON.stringify(obj),
      write = function(buf){
        res.writeHead(code, {
          'Content-Type': 'application/json',
          'Content-Length': buf.length,
          'Access-Control-Allow-Origin': '*'
        });
        res.end(buf);
      };
    if (json.length > 255){
      zlib.deflate(json, function(err, buf){
        res.setHeader('Content-Encoding', 'deflate');
        write(buf);
      });
    }else{
      write(new Buffer(json));
    }
  };
  
  req.parseParams = function(cb){
    if (!_fieldMap && !_fileMap){
      if ('POST' === req.method){
        new formidable.IncomingForm().parse(req, function(err, fields, files){
          _postMap = fields;
          _fileMap = files;
          cb(_postMap, _fileMap);
        });
      }else{
        _fieldMap = url.parse(req.url, true).query;
        cb(_fieldMap, _fileMap);
      }
    }else{
      cb(_fieldMap, _fileMap);
    }
  }
  // TODO: use process.on('uncaughtException', function(err))
  try {
    route(req, res);
  } catch(err){
    console.log(err.description);
  }
}

exports.init = function(cfg, cb){
  var web = http.createServer(process);
  web.listen(cfg.port, cfg.host, function(){
    console.log('Web @ http://' + (cfg.host || '127.0.0.1') + ':' + cfg.port.toString() + '/');
    web.setRoute = setRoute;
    cb(null, web);
  });
}

