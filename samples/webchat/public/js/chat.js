var
DOMAIN = 'http://107.20.154.29:1337/',
TIMEOUT = 1000 * 5, // 5 sec timeout
userBox = null,
chatBox = null,
roomBox = null,
cookieObj = null;

/*
 * to get form's field use:
 * span.innerHTML = self.elements['msg'].value;
 */
ajax = function(method, domain, params, timeout, cb){
  var
  xhr = window.XMLHttpRequest ? new window.XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP'),
  post = 'post' === method;

  xhr.timeout = timeout || TIMEOUT;

  if (!post){
    domain += '?'+params;
    params = null;
  }

  xhr.open(method, domain, true);

  if (post){
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  }

  xhr.send(params);
  xhr.onreadystatechange=function(){
    if (4 === xhr.readyState){
      if (cb) return cb(xhr.status, xhr.responseText);
    }
  }
},

setCookie = function(obj, days){
  var 
  json = JSON.stringify(obj),
  cookie = 'd='+json;

  if (days){
    var expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    cookie += ';expires='+expiry.toUTCString();
  }
  console.log('setCookie: '+cookie);
  document.cookie=cookie;
},

getCookie = function(){
  if (document.cookie.length < 5)
    return null;

  var kvp = document.cookie.split('=');
  console.log('getCookie: '+document.cookie);
  return JSON.parse(kvp[1]);
},

onReady = function(){

  if (navigator.userAgent.match(/Mobile/i)) {
    setTimeout(function(){ window.scrollTo(0,1);},0);
  }
    
  cookie = getCookie();
  if(cookie) post(DOMAIN+'/users/auth', 'session='+cookie.session, onAuthSuccess);

  userBox = document.getElementById('userBox');
  chatBox = document.getElementById('chatBox');
  roomBox = document.getElementById('roomBox');
/*  $("#formUser").submit(function(e){
    e.preventDefault();
    post(this.action, $(this).serialize(), onCreateSuccess, onCreateFail);
  });
  $("#formMsg").submit(function(e){
    e.preventDefault();
    post(this.action, $(this).serialize(), onChatSuccess);
  });
  $("#formRefresh").submit(function(e){
    e.preventDefault();
    get(this.action, $(this).serialize(), onUpdateRoomSuccess);
  });*/
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

},

onCreateSuccess = function(data){
  console.log('onCreateSuccess');
  cookie = data;
  onAuthSuccess(data);

  setCookie(data, 1);
},

onCreateFail = function(jqXHR, textStatus){
  alert(textStatus);
},

onAuthSuccess = function(data){
  console.log('onAuthSuccess');
  console.dir(data);
  if (!data.name) return console.log('expired!');
  userBox.innerHTML = data.name;

  var form = document.getElementById('formMsg');
  form.elements['session'].value = cookie.session;
  var form = document.getElementById('formRefresh');
  form.elements['session'].value = cookie.session;

  get(DOMAIN+'/users/list', 'session='+cookie.session, onUpdateRoomSuccess);
},

onChatSuccess = function(data){
  console.log('onChatSuccess!');
  console.dir(data);
  var
    span = null,
    m = null,
    l = data.msgs;

  for (var i=0, j=l.length; i<j; ++i){
    span = document.createElement('span');
    span.setAttribute('class', 'msg');
    m = JSON.parse(l[i]);
    span.innerHTML = m.name+': '+m.msg;
    chatBox.appendChild(span);
  }
  chatBox.scrollTop = chatBox.scrollHeight;
},

onUpdateRoomSuccess = function(data){
  console.log('onUpdateRoomSuccess!');
  console.dir(data);
  var
    list = data.list,
    span = null,
    user = null;

  roomBox.innerHTML = "";
  for (var i=list.length-1; i>=0; --i){
    user = JSON.parse(list[i]);
    span = document.createElement('span');
    span.setAttribute('class', 'msg');
    span.setAttribute('id', user.session);
    span.innerHTML = user.name;
    roomBox.appendChild(span);
  }
};
