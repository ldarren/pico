const
AJAX_TIMEOUT = 60 * 5, // ajax timeout
CONTENT_TYPE = 'Content-type',
TYPE_FORM = 'application/x-www-form-urlencoded',
POST = 'post',
GET = 'get';

var
processMsgs = function(state, data, startPos){

},

/*
 * to get form's field use:
 * span.innerHTML = self.elements['msg'].value;
 */
ajax = function(method, domain, params, timeout){
  var
  xhr = window.XMLHttpRequest ? new window.XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP'),
  post = POST === method,
  data,
  pos = 0;

  xhr.timeout = timeout || AJAX_TIMEOUT;

  if (!post){
    domain += '?'+params;
    params = null;
  }

  xhr.open(method, domain, true);

  if (post){
    xhr.setRequestHeader(CONTENT_TYPE, TYPE_FORM);
  }

  xhr.send(params);
  xhr.onreadystatechange=function(){
    if (3 > xhr.readyState){
      data = xhr.responseText;
      processMsgs(xhr.status, data, pos);
      pos = data.length;
    }
  }
},

saveCookie = function(obj, days){
  var 
  json = JSON.stringify(obj),
  cookie = 'd='+json;

  if (days){
    var expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    cookie += ';expires='+expiry.toUTCString();
  }
  console.log('saveCookie: '+cookie);
  document.cookie=cookie;
},

loadCookie = function(){
  if (document.cookie.length < 5)
    return null;

  var kvp = document.cookie.split('=');
  console.log('loadCookie: '+document.cookie);
  return JSON.parse(kvp[1]);
},

setRoute = function(act, workers){
  router[act] = workers;
},

processMsgs = function(){
  setTimeout(processMsgs, 0);
},

onReady = function(){

  if (navigator.userAgent.match(/Mobile/i)) {
    setTimeout(function(){ window.scrollTo(0,1);},0);
  }
    
  cookie = loadCookie();
  if(cookie) post(DOMAIN+'/users/auth', 'session='+cookie.session, onAuthSuccess);

},

submit = function(evt){
  var
  inputs = this.getElementsByTagName('input'),
  input,
  l = inputs.length,
  params = '';

  while(l--){
    input = inputs[l];
    if (!input || !input.name || !input.value) continue;
    if (0===l)
      params += input.name +'='+input.value;
      else
        params += input.name +'='+input.value+'&';
  }

  ajax(this.method, this.action, params, TIMEOUT, function(status, data){
    if (200 === status){
      var
      msgs = JSON.parse(data),
      msg,
      l = msgs.length;

      while(l--){
        msg = msgs.pop();
        routes[msg.act](msg);
      }
    }else{
      console.error(data);
    }
  });

};
