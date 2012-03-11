var base = require('./base');
const 
  ERROR_NOT_FOUND = 'not found';

function NotFound(msg){
  this.parent.code = 404;
  this.parent.body.msg = msg ? msg : ERROR_NOT_FOUND;
}

base.born(NotFound);
