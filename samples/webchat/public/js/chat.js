var
  domain = 'http://107.20.154.29:1337',
  userBox = null,
  chatBox = null,
  roomBox = null,
  cookieObj = null;

/*
 * to get form's field use:
 * span.innerHTML = self.elements['msg'].value;
 */
function post(url, data, ok, ko){
  console.log('data[%s]',data);
  $.ajax({
    url: url,
    data: data,
    success: ok,
    error: ko
  });
}

function get(url, data, cb){
  $.ajax({
    type: 'GET',
    url: url,
    data: data,
    success: cb
  });
}

function setCookie(obj, days){
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
}

function getCookie(){
  if (document.cookie.length < 5)
    return null;

  var 
    kvp = document.cookie.split('=');
  console.log('getCookie: '+document.cookie);
  return JSON.parse(kvp[1]);
}

$(document).ready(function(){
    
  $.ajaxSetup({
    type: 'POST',
    timeout: 5 * 1000, // timeout 5 sec
    dataType: 'json'
  });

  cookie = getCookie();
  if(cookie) post(domain+'/users/auth', 'session='+cookie.session, onAuthSuccess);

  userBox = document.getElementById('userBox');
  chatBox = document.getElementById('chatBox');
  roomBox = document.getElementById('roomBox');
  $("#formUser").submit(function(e){
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
  });
});

function onCreateSuccess(data){
  console.log('onCreateSuccess');
  cookie = data;
  onAuthSuccess(data);

  setCookie(data, 1);
}

function onCreateFail(jqXHR, textStatus){
  alert(textStatus);
}

function onAuthSuccess(data){
  console.log('onAuthSuccess');
  console.dir(data);
  if (!data.name) return console.log('expired!');
  userBox.innerHTML = data.name;

  var form = document.getElementById('formMsg');
  form.elements['session'].value = cookie.session;
  var form = document.getElementById('formRefresh');
  form.elements['session'].value = cookie.session;

  get(domain+'/users/list', 'session='+cookie.session, onUpdateRoomSuccess);
}

function onChatSuccess(data){
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
}

function onUpdateRoomSuccess(data){
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
}
