exports.saveRecords = function(o, k, v){
  if (!o) o = {};
  for(var i=0,j=k.length; i<j; ++i){
    o[k[i]] = v[i];
  }
  return o;
}
