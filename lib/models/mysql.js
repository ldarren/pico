var
Model = function(){};

Model.prototype = {
  setup: function(cfg, cb){
  },
  fillValues : function (len, unit){
      var
      ret = '',
      unitComma = unit+',';
      while(--len) {ret += unitComma;}
      ret += unit;
      return ret;
  }
}

module.exports = Model;
