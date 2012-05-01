var
util = require('util'),
url = require('url'),
http = require('http'),
port = 1337,
host = null,
queue = [],
connection = null,
output = [],
id = setInterval(function(){
  var
  data,load,temp=[];
  while(queue.length){
    data = queue.pop();
    output.push(data.msg);
    --data.count;
console.log('count<%s> msg<%s>',data.count, data.msg);
    if (data.count) temp.push(data);
  }
  queue = temp;
  if (output.length && connection){
    --connection.count;
    load = JSON.stringify(output);
    if (!connection.count){
      connection.res.end(load);
      connection = null;
    }else{
      connection.res.write(load);
    }
console.log('send count<%s> load<%s>',connection.count, load);
    output=[];
  }
}, 1000),
server = http.createServer(function(req, res){
  var
  query = url.parse(req.url, true).query,
  role = query['role'],
  data;

  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Access-Control-Allow-Origin': '*'
  });

  switch(role){
    case 'o':
      data = JSON.parse(query['data']);
      if (data.length > 0) queue = queue.concat(data);
      else queue.unshift(data);
      res.end();
console.log('received len<%d> data<%s> queue<%s>',data.length,util.inspect(data),util.inspect(queue));
      break;
    case 'i':
      connection = {count:120, res:res};
console.log('received connection');
      break;
  }
});

server.listen(port, host, function(){
  console.log('listening to %s:%d', host||'*', port);
});
