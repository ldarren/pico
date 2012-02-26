var 
  sampleLogic = require('../build/Release/sample_logic'),
  logic = new sampleLogic.Logic();

logic.message = "Darren";
logic.read({first:'Darren', last:'Liew'}, function(msg){
  console.log(msg);
});
