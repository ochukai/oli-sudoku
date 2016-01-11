var Sudoku = require('./sudoku');
var _ = require('underscore');

var line = '000000010400000000020000000000050407008000300001090000300400200050100000000806000';

function parse(line) {
    var result = [];

    for (var i = 0; i < 9; i++) {
        var gap = i * 9;
        result[i] = _.map(line.substring((0 + gap), (9 + gap)).split(''), function (char) {
            return char | 0;// convert to number;
        });
    }
    return result;
}

var start = new Date();
var arr = parse(line);

var sudoku = new Sudoku(arr);
sudoku.resolve();
console.log('cost:', new Date() - start);
console.log(sudoku.answer);

