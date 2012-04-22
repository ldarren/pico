var Model = function(){};

Model.prototype = {
  sLoop : function (client, cmd, key, arr, cb){
    var l = arr.length;
    if (!l) return cb();

    var tasks = [];

    while(l--) tasks.push([cmd, key, arr[l]]);

    client.multi(tasks).exec(cb);
  },

  parseInts : function(arr){
    var l = arr.length;
    while(l--) arr[l] = parseInt(arr[l]);
    return arr;
  }
};
