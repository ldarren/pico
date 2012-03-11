var 
  BaseError = {
    code: 400,
    head: {},
    body: { msg:'Error' }
  };

BaseError.born = function(child){
  child.prototype = BaseError;
  child.prototype.parent = BaseError;
  child.prototype.constructor = child;
}

module.exports = BaseError;
