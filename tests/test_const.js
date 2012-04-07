const
  CONST = {
    VALUE: "1234"
  };

CONST.VALUE = "4567";
console.log('change CONST.value: '+CONST.VALUE);
CONST = {VALUE:"Hello"};
console.log('change CONST: '+CONST.VALUE);

var $c = CONST;
$c.VALUE = "4567";
console.log('change c.value: '+$c.VALUE);
$c = {VALUE:"Hello"};
console.log('change c: '+$c.VALUE);
