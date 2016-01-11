var _ = require('underscore');
var DancingLinkX = require('./dlx');

// [1, 2, 3, 4, 5, 6, 7, 8, 9];
var nines = _.range(1, 10);

/**
 * The columns represent the constraints of the puzzle. In Sudoku, we have 4:
 *   # A position constraint: Only 1 number can occupy a cell
 *   # A row constraint: Only 1 instance of a number can be in the row
 *   # A column constraint: Only 1 instance of a number can be in a column
 *   # A region constraint: Only 1 instance of a number can be in a region
 * Therefore there are SIZE^2 * 4 columns, where SIZE is the number of candidates/rows/cols.
 * In a 9 x 9, there are 324 columns.
 *
 * The rows represent every single possible position for every number.
 * Therefore, there are SIZE^3 rows.
 * In a 9 x 9, this would be 729 rows.
 */
var Sudoku = function (sudoku) {
    this.origin = sudoku;

    this.dlxArr = [];

    this.hasSingle = false;
    this.availables = [];
    for (var i = 0; i < 9; i++) {
        this.availables[i] = [];
    }
};

/**
 * 0,1,2 -> [0, 2]
 * 3,4,5 -> [3, 5]
 * 6,7,8 -> [6, 8]
 *
 * @param n
 * @returns {*[start, end]}
 */
function range(n) {
    var end = Math.ceil((n + 1) / 3) * 3;
    return [end - 3, end - 1];
}


/**
 * get available numbers in the (row, col)
 *
 * @param x 0-8 index of col
 * @param y 0-8 index of row
 */
Sudoku.prototype.available = function (x, y) {
    var target = this.origin;

    // get row
    var related = _.clone(target[y]);

    // get col
    _.each(target, function (row) {
        related.push(row[x]);
    });

    // get square
    var rangeX = range(x);
    var rangeY = range(y);
    for (var i = rangeY[0]; i <= rangeY[1]; i++) {
        for (var j = rangeX[0]; j <= rangeX[1]; j++) {
            related.push(target[i][j]);
        }
    }

    return _.difference(nines, related);
};

Sudoku.prototype.computeAvailableAndFillSingleAnswer = function () {
    this.hasSingle = false;

    for (var i = 0; i < this.origin.length; i++) {
        var row = this.origin[i];
        for (var j = 0; j < row.length; j++) {
            var n = row[j]; // number at this position.
            if (n === 0) {
                // calculate available number at this position
                var avails = this.availables[i][j] = this.available(j, i);
                // console.log('(', j, ',', i, ')', avails);

                if (avails.length === 1) {
                    this.hasSingle = true;
                    this.origin[i][j] = avails[0];
                }
            }
        }
    }
};

Sudoku.prototype.computeAndFill = function () {
    this.computeAvailableAndFillSingleAnswer();
    while (this.hasSingle) {
        this.computeAvailableAndFillSingleAnswer();
    }
};

Sudoku.prototype.mappingEmpty = function () {
    for (var i = 0; i < this.origin.length; i++) {
        var row = this.origin[i];
        for (var j = 0; j < row.length; j++) {
            var n = row[j]; // number at this position.
            if (n === 0) {
                this.addEmpty(i, j);
            }
        }
    }
};

Sudoku.prototype.addEmpty = function (i, j) {
    var avails = this.availables[i][j];
    _.each(avails, function (k) {
        this.add(j, i, k);
    }, this);
};

Sudoku.prototype.mapping = function () {
    this.computeAndFill();

    for (var i = 0; i < this.origin.length; i++) {
        var row = this.origin[i];
        for (var j = 0; j < row.length; j++) {
            var n = row[j]; // number at this position.
            if (n !== 0) {
                this.add(j, i, n);
            }
        }
    }

    this.mappingEmpty();
};

Sudoku.prototype.add = function (x, y, n) {
    this.dlxArr.push([
        this.toIndex(x, y),
        this.toRowIndex(y, n),
        this.toColIndex(x, n),
        this.toBoxIndex(x, y, n)
    ]);
};

Sudoku.prototype.resolve = function () {
    this.mapping();

    this.dlx = new DancingLinkX(324, this.dlxArr); // 81 * 4
    this.dlx.dance();

    this.parse();
};

/**
 *   A position constraint: Only 1 number can occupy a cell
 *   ---- 0 - 80
 *   ----              (x, y) -> a number
 *   ---- index[0]  == (0, 0)
 *   ---- ....
 *   ---- index[15] == (1, 6)
 *   ---- index[16] == (1, 7)
 *   ---- ....
 *   ---- index[80] == (8, 8)
 *   ----
 *   ---- x = Math.floor(index / 9), y = index % 9
 *   ---- index = x * 9 + y
 *
 * @param x
 * @param y
 */
Sudoku.prototype.toIndex = function (x, y) {
    return x * 9 + y;
};

/**
 *   # A row constraint: Only 1 instance of a number can be in the row
 *   ---- 81 - 161
 *   ----               y -> n       | y -> 0
 *   ---- index[81]  == 0 -> 1       |      1
 *   ---- index[82]  == 0 -> 2       |      2
 *   ---- ....                       |      3
 *   ---- index[93]  == 1 -> 4       |      4
 *   ---- index[94]  == 1 -> 5       |      5
 *   ---- ....                       |      6
 *   ---- index[161] == 8 -> 9       |      7
 *   ----                            |      8
 *   ----
 *   ---- y = Math.floor((index - 81) / 9), n = (index - 81) % 9 + 1
 *   ---- index = y * 9 + (n - 1) + 81 = y * 9 + n + 80
 *
 * @param y
 * @param n
 */
Sudoku.prototype.toRowIndex = function (y, n) {
    return y * 9 + n + 80;
};

/**
 *   # A column constraint: Only 1 instance of a number can be in a column
 *   ---- 162 - 242
 *   ----               x -> n       | x -> 0 1 2 3 4 5 6 7 8
 *   ---- index[162] == 0 -> 1
 *   ---- ....
 *   ---- index[173] == 1 -> 2
 *   ---- index[174] == 1 -> 3
 *   ---- ....
 *   ---- index[242] == 8 -> 9
 *   ----
 *   ---- x = Math.floor((index - 162) / 9), n = (index - 162) % 9 + 1
 *   ---- index = x * 9 + (n - 1) + 162 = x * 9 + n + 161
 *
 * @param x
 * @param n
 */
Sudoku.prototype.toColIndex = function (x, n) {
    return x * 9 + n + 161;
};

/**
 *   # A region or a box constraint: Only 1 instance of a number can be in a region
 *   ---- 243 - 323
 *   ----               b -> n       |  b -> 0 1 2
 *   ---- index[243] == 0 -> 1       |    -> 3 4 5
 *   ---- ....                       |    -> 6 7 8
 *   ---- index[279] == 3 -> 4
 *   ---- index[280] == 3 -> 5
 *   ---- ....
 *   ---- index[323] == 8 -> 9
 *   ----
 *   ---- b = Math.floor((index - 243) / 9), n = (index - 243) % 9 + 1
 *   ---- index = b * 9 + (n - 1) + 243 = b * 9 + n + 242
 *
 * @param x
 * @param y
 * @param n
 */
Sudoku.prototype.toBoxIndex = function (x, y, n) {
    return this.xyToBox(x, y) * 9 + n + 242
};

Sudoku.prototype.xyToBox = function (x, y) {
    return Math.floor(y / 3) * 3 + Math.floor(x / 3);
};

Sudoku.prototype.parse = function() {
    this.answer = [];
    for (var i = 0; i < 9;i++) {
        this.answer[i] = [];
    }

    _.each(this.dlx.answer, function(index) {
        var row = this.dlxArr[index - 1];
        var a = row[0],
            b = row[1],
            c = row[2],
            x,
            y,
            n;

        /**
         * 9x + y       = a
         * 9y + n + 80  = b
         * 9x + n + 160 = c
         */
        x = (9 * a - b + c - 81) / 90;
        y = a - 9 * x;
        n = b - 80 - 9 * y;

        this.answer[y][x] = n;
        //console.log('x:', x, ',y:', y, ',n:', n);
    }, this);
};

module.exports = Sudoku;