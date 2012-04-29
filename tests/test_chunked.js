var
http = require('http'),
port = 1337,
host = null,
server = http.createServer(function(req, res){
  var count = 10;
  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Access-Control-Allow-Origin': '*'
    });
  var id = setInterval(function(){
    if (count--){
      res.write(count.toString()+';');
      console.log(count.toString());
    }else{
      res.end('done;');
      console.log('done');
      clearInterval(id);
    }
  }, 1000);
});

server.listen(port, host, function(){
  console.log('listening to %s:%d', host||'*', port);
});
