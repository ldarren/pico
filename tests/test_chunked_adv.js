var
util = require('util'),
url = require('url'),
http = require('http'),
port = 1337,
host = null,
queue = [],
connections = {},
output = [],

id = setInterval(function(){
  var
  data,temp=[],
  keys = Object.keys(connections),
  l = keys.length;

  while(queue.length){
    data = queue.pop();
    output.push(data.msg);
    --data.count;
console.log('count<%s> msg<%s>',data.count, data.msg);
    if (data.count) temp.push(data);
  }
  queue = temp;
  if (output.length && l){
    var
    load = JSON.stringify(output),
    k;

    while(l--){
      k = keys[l];
      conn = connections[k];
      --conn.count;
      if (!conn.count){
        conn.res.end(load);
        delete connections[k];
console.log('end uid<%s> count<%d> load<%s>',k, conn.count, load);
      }else{
        conn.res.write(load);
console.log('send uid<%s> count<%d> load<%s>',k, conn.count, load);
      }
    }
    output=[];
  }
}, 1000),

dc = function(){
console.log('dc uid<%s>',this.uid);
  delete connections[this.uid];
},

server = http.createServer(function(req, res){
  var
  query = url.parse(req.url, true).query,
  uid = query['uid'],
  role = query['role'],
  data;

  res.uid = uid;
  res.on('close', dc);

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
      connections[uid] = {count:30, res:res};
console.log('received connection <%s>',uid);
      break;
  }
});

server.listen(port, host, function(){
  console.log('listening to %s:%d', host||'*', port);
});
