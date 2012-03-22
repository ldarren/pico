var 
  http = require('http'),
  url = require('url'),
  qs = require('querystring'),
  formidable = require('formidable'),
  zlib = require('zlib'),
  util = require('util'),
  ErrorNotFound = require('../errors/notFound'),

  routes = {},
  defaultPipeline = [],
  allowDomain = '*',
  getURI = parseURI;

const
  CONTENT_TYPE = 'Content-Type',
  CONTENT_LENGTH = 'Content-Length',
  CONTENT_ENCODING = 'Content-Encoding',
  ALLOW_XORIGIN = 'Access-Control-Allow-Origin',
  TYPE_JSON = 'application/json;charset=UTF-8',
  ENCODE_DEFLATE = 'deflate',
  GET = 'GET',
  POST = 'POST';

function setDefaultPipeline(pipeline){
  defaultPipeline = pipeline;
}

function setGETRoute(path, pipeline){
  setRoute(GET+path, pipeline);
}

function setPOSTRoute(path, pipeline){
  setRoute(POST+path, pipeline);
}

function setRoute(path, pipeline){
  routes[path] = pipeline.concat(defaultPipeline);
}

function parseURI(req){
  return url.parse(req.url).pathname;
}

function parseMethodURI(req){
  return req.method+url.parse(req.url).pathname;
}

function makeParams(req, res, product, cb){
  if (POST === req.method){
    new formidable.IncomingForm().parse(req, function(err, params, file){
      product.params = params;
      product.file = file;
    });
  }else{
    product.params = url.parse(req.url, true).query;
  }
  return cb(null, product);
}

function makeJSON(req, res, product, cb){
  product.body = JSON.stringify(product.body);
  product.head[CONTENT_TYPE] = TYPE_JSON;
  return cb(null, product);
}

function makeHTTP(req, res, product, cb){
  var
    body = product.body || "",
    head = product.head || {};

  if (body.length > 255){
    zlib.deflate(body, function(err, buf){
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

  return cb(null, product);
}

function factory(req, res){
  var
    pipeline = routes[getURI(req)],
    product = {head:{},body:{}},
    cursor = 0,
    count = 0,

    doWork = function(){
      pipeline[cursor++](req, res, product, function(err, output){
        if (err) {
          pipeline = defaultPipeline;
          product = err;
          cursor = 0;
          count = pipeline.length;
          //console.log('### err: '+util.inspect(err)+', product: '+util.inspect(product));
        } else {
          product = output;
          //console.log('err: '+util.inspect(err)+', product: '+util.inspect(product));
        }

        if (cursor < count) {
          process.nextTick(doWork);
        }
      });
    }

  if(pipeline){
    count = pipeline.length;
  }else{
    pipeline = defaultPipeline;
    product = new ErrorNotFound();
    count = pipeline.length;
  }

  doWork();
}

exports.init = function(cfg, cb){
  var web = http.createServer(factory);
  web.listen(cfg.port, cfg.host, function(){
    console.log('Web @ http://%s:%d/',(cfg.host || '127.0.0.1'),cfg.port);

    allowDomain = cfg.allowDomain || '*';

    if (cfg.debug){
      web.setGETRoute = setRoute;
      web.setPOSTRoute = setRoute;
      getURI = parseURI;
    }else{
      web.setGETRoute = setGETRoute;
      web.setPOSTRoute = setPOSTRoute;
      getURI = parseMethodURI;
    }

    web.setDefaultPipeline = setDefaultPipeline;

    web.makeParams = makeParams;
    web.makeJSON = makeJSON;
    web.makeHTTP = makeHTTP;

    cb(null, web);
  });
}
