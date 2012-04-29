var
util = require('util'),
url = require('url'),
http = require('http'),
port = 1337,
host = null,
queue = [],
id = setInterval(function(){
  var
  l = queue.length,
  m;
  if (l){
    while(l--){
      m = queue[l];
      if (10 === m.index){
        m.res.end('done');
        queue.pop();
        continue;
      }
      var
      data = m.data,
      c = data.length,
      p;
      if (!c) continue;
      while(c--){
        p = data[c]
        m.total += p.param1 + p.param2 + p.param3;
      }
      ++m.index;
      m.res.write(m.total.toString());
      console.log('send <%s>',m.total.toString());
    }
  }
}, 1000),
server = http.createServer(function(req, res){
  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Access-Control-Allow-Origin': '*'
  });
  var data = JSON.parse(url.parse(req.url, true).query['data']);
  queue.unshift({index:0, total:0, res:res, data:data});
  console.log(util.inspect(data));
});

server.listen(port, host, function(){
  console.log('listening to %s:%d', host||'*', port);
});
