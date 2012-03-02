var 
  http = require('http'),
  url = require('url'),
  qs = require('querystring'),
  formidable = require('formidable'),
  zlib = require('zlib'),

  routes = {},
  allowDomain = '*';

const
  ERROR_NOT_FOUND = 'not found',
  ERROR_NOT_IMPLEMENTED = 'not implemented',
  CONTENT_TYPE = 'Content-Type',
  CONTENT_LENGTH = 'Content-Length',
  CONTENT_ENCODING = 'Content-Encoding',
  ALLOW_XORIGIN = 'Access-Control-Allow-Origin',
  TYPE_JSON = 'application/json',
  ENCODE_DEFALTE = 'deflate';


function setRoute(path, pipeline){
  routes[path] = pipeline;
}

function makeParams(req, res, product, cb){
  if ('POST' === req.method){
    new formidable.IncomingForm().parse(req, function(err, params, file){
      product.params = params;
      product.file = file;
    });
  }else{
    product.params = url.parse(req.url, true).query;
  }
  cb(null, product);
}

function makeError(req, res, product, cb){
  return cb(null, {code:404,body:{msg:ERROR_NOT_FOUND}});
}

function makeJSON(req, res, product, cb){
  product.body = JSON.stringify(product.body);
  product.head[CONTENT_TYPE] = TYPE_JSON;
  cb(null, product);
}

function makeHTTP(req, res, product, cb){
  var
    body = product.body,
    head = product.head;

  if (body.length > 255){
    zlib.deflate(json, function(err, buf){
      body = buf;
      head[CONTENT_TYPE] = ENCODE_DEFLATE;
    });
  }else{
    body = new Buffer(body);
  }

  head[CONTENT_LENGTH] = data.length;
  head[ALLOW_XORIGIN] = allowDomain;
  res.writeHead(product.code || 200, head);
  res.end(body);
}

// TODO: use process.on('uncaughtException', function(err))

function process(req, res){
  var
    uri = url.parse(req.url).pathname,
    pipeline = routes[uri] || [makeError,makeJSON],
    product = {head:{},body:{}};

  function doWork(){
    if (0 === pipeline.length)
      return makeHTTP(req, res, product);

    var step = pipeline.pop();
    step(req, res, product, function(err, goods){
      product = goods;
      process.nextTick(doWork);
    });
  }

  doWork();
}

exports.init = function(cfg, cb){
  var web = http.createServer(process);
  web.listen(cfg.port, cfg.host, function(){
    console.log('Web @ http://' + (cfg.host || '127.0.0.1') + ':' + cfg.port.toString() + '/');
    allowDomain = cfg.allowDomain || '*';
    web.setRoute = setRoute;
    cb(null, web);
  });
}

