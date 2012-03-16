var 
  start = 0,
  perf1 = 0,
  perf2 = 0,
  count = 0,
  tmp = '';

const LOOP = 10000001;

count = LOOP;
console.log('test toString(16)...');
start = (new Date()).getTime();
while(count--){
  tmp = count.toString(16);
}
perf1 = (new Date()).getTime()-start;

count = LOOP;
console.log('test string+...');
start = (new Date()).getTime();
while(count--){
  tmp = ''+count;
}
perf2 = (new Date()).getTime()-start;

count = LOOP;
console.log('test toString...');
start = (new Date()).getTime();
while(count--){
  tmp = count.toString();
}
perf3 = (new Date()).getTime()-start;

console.log('toString16: %d ms', perf1);
console.log('string+: %d ms', perf2);
console.log('toString: %d ms', perf3);
