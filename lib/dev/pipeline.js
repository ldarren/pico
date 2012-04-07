var
util = require('util'),
url = require('url'),

allowDomain = '*',
routes = {},
defaultWorkers = [],
clients = [],
clients = [],
getURI = parseURI;

const
  CONTENT_TYPE = 'Content-Type',
  CONTENT_LENGTH = 'Content-Length',
  CONTENT_ENCODING = 'Content-Encoding',
  ALLOW_XORIGIN = 'Access-Control-Allow-Origin',
  TYPE_JSON = 'application/json;charset=UTF-8',
  ENCODE_DEFLATE = 'deflate',
  TIMEOUT = 58000,
  GET = 'GET',
  POST = 'POST';

// must call be setRoute, setGETRoute and setPOSTRoute
function setDefaultWorkers(workers){ defaultWorkers = workers; }

function setGETRoute(path, workers){ setRoute(GET+path, workers); }

function setPOSTRoute(path, workers){ setRoute(POST+path, workers); }

function setRoute(path, workers){routes[path] = workers.concat(defaultWorkers);}

function parseURI(req){ return url.parse(req.url).pathname; }

function parseMethodURI(req){ return req.method+url.parse(req.url).pathname; }

function makeParams(client, product, cb){
  var
  res = client.res,
  req = client.req;

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

function makeJSON(client, product, cb){
  product.body = JSON.stringify(product.body);
  product.head[CONTENT_TYPE] = TYPE_JSON;
  return cb(null, product);
}

function makeHTTP(client, product, cb){
  var
  req = client.req,
  res = client.res,
  body = product.body || "",
  head = product.head || {},
  code = product.code || 200;

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
  res.writeHead(code, head);
  if (200 !== code || product.elapsed > TIME_OUT)
    res.end(body);
  else
    res.write(body);

  return cb(null, product);
}

function oneTask(client, workers, cb){
  var
  req = client[0],
  elapsed = Date.now() - req.socket._idleStart.getTime(),
  product = {head:{},body:{},elapsed:elapsed},
  cursor = 0,
  count = workers.length,
  errCount = 0;

  doWork = function(){
    workers[cursor++](client, product, function(err, output){
      if (err) {
        workers = defaultWorkers;
        product = err;
        cursor = 0;
        count = workers.length;
        ++errCount;
        if (errCount > 3) return cb(errCount); // prevent infinite loop
        //console.log('### err: '+util.inspect(err)+', product: '+util.inspect(product));
      } else {
        product = output;
        //console.log('err: '+util.inspect(err)+', product: '+util.inspect(product));
      }

      if (cursor < count) {
        process.nextTick(doWork);
      }else{
        return cb(errCount || elapsed > TIME_OUT, client);
      }
    });
  };

  doWork();
}

function supervise(list, cb){
  if (!list.length) return cb();

  oneTask(list.pop(), defaultWorkers, function(err, client){
    if (!err) clients.push(client);
    supervise(list, cb);
  });

}

(function production(){
  if (!clients.length) return setTimeout(production, 1000);
  var list = clients.reverse(); // make sure last in last out
  clients = [];
  supervise(list, function(){
    process.nextTick(production);
  });
}).call(this);

exports.init = function(cfg, cb){
  var pipeline = {};

  if (cfg.debug){
    pipeline.setGETRoute = setRoute;
    pipeline.setPOSTRoute = setRoute;
    getURI = parseURI;
  }else{
    pipeline.setGETRoute = setGETRoute;
    pipeline.setPOSTRoute = setPOSTRoute;
    getURI = parseMethodURI;
  }

  pipeline.setDefaultWorkers = setDefaultWorkers;

  pipeline.makeParams = makeParams;
  pipeline.makeJSON = makeJSON;
  pipeline.makeHTTP = makeHTTP;

  return cb(null, pipeline);
}

exports.addHTTPClient = function(req, res){
  var
  workers = routes[getURI(req)];

  if(workers){
    count = workers.length;
  }else{
    workers = defaultWorkers;
    product = new ErrorNotFound();
    count = workers.length;
  }

  oneTask([req, res, {}], workers, function(err, client){
    if (!err)
      clients.push(client);
  });
}
