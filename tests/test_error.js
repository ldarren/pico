var
err = new Error('Unknow error'),
util = require('util');

console.log('Error[%s]',util.inspect(err));
console.log('Error.number[%d]',util.inspect(err.number));
console.log('Error.message[%s]',util.inspect(err.message));
