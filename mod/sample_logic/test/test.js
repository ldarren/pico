var 
  sampleLogic = require('../build/Release/sample_logic'),
  logic = new sampleLogic.Logic();

logic.message = "Darren";
console.log(logic.read());
