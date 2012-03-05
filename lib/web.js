var 
  http = require('http'),
  url = require('url'),
  qs = require('querystring'),
  formidable = require('formidable'),
  zlib = require('zlib'),

  routes = {},
  defaultPipeline = [],
  allowDomain = '*';

const
  ERROR_NOT_FOUND = 'not found',
  ERROR_NOT_IMPLEMENTED = 'not implemented',
  CONTENT_TYPE = 'Content-Type',
  CONTENT_LENGTH = 'Content-Length',
  CONTENT_ENCODING = 'Content-Encoding',
  ALLOW_XORIGIN = 'Access-Control-Allow-Origin',
  TYPE_JSON = 'application/json;charset=UTF-8',
  ENCODE_DEFALTE = 'deflate';

function setRoute(path, pipeline){
  routes[path] = pipeline;
}

function addDefaultPipeline(step){
  defaultPipeline.push(step);
}

function makeError(req, res, product, cb){
  return cb(null, {code:404,head:{},body:{msg:ERROR_NOT_FOUND}});
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

function makeJSON(req, res, product, cb){
  product.body = JSON.stringify(product.body || {});
  product.head[CONTENT_TYPE] = TYPE_JSON;
  cb(null, product);
}

function makeHTTP(req, res, product, cb){
  var
    body = product.body || {},
    head = product.head || {};

  if (body.length > 255){
    zlib.deflate(json, function(err, buf){
      body = buf;
      head[CONTENT_TYPE] = ENCODE_DEFLATE;
    });
  }else{
    body = new Buffer(body);
  }
  head[CONTENT_LENGTH] = body.length;
  head[ALLOW_XORIGIN] = allowDomain;
  res.writeHead(product.code || 200, head);
  res.end(body);
}

// TODO: use process.on('uncaughtException', function(err))

function factory(req, res){
  var
    uri = url.parse(req.url).pathname,
    pipeline = defaultPipeline.concat(routes[uri] || [makeError]);
    product = {head:{},body:{}},
    doWork = function(){
      var step = pipeline.pop();
      step(req, res, product, function(err, output){
        product = output;

        if (pipeline.length) {
          process.nextTick(doWork);
        }
      });
    }

  doWork();
}

exports.init = function(cfg, cb){
  var web = http.createServer(factory);
  web.listen(cfg.port, cfg.host, function(){
    console.log('Web @ http://' + (cfg.host || '127.0.0.1') + ':' + cfg.port.toString() + '/');

    allowDomain = cfg.allowDomain || '*';

    web.setRoute = setRoute;
    web.addDefaultPipeline = addDefaultPipeline;

    web.makeParams = makeParams;
    web.makeJSON = makeJSON;
    web.makeHTTP = makeHTTP;

    cb(null, web);
  });
}
