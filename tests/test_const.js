var
CONST = {
  VALUE: "1234"
};

CONST.VALUE = "4567";
console.log('change CONST.value: '+CONST.VALUE);
CONST = {VALUE:"Hello"};
console.log('change CONST: '+CONST.VALUE);

Object.freeze(CONST);
CONST.VALUE = "890";
console.log('change CONST.value: '+CONST.VALUE);
CONST = {VALUE:"nihao"};
console.log('change CONST: '+CONST.VALUE);

var $c = CONST;
$c.VALUE = "abcd";
console.log('change c.value: '+$c.VALUE);
$c = {VALUE:"World"};
console.log('change c: '+$c.VALUE);
