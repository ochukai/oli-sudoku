(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        //define(['jquery', 'underscore'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS style for Browserify/Seajs
        module.exports = factory(require('jquery'), require('underscore'));
    } else {
        // Browser globals
        factory(jQuery, _);
        //factory();
    }
}(function ($, _) {
    'use strict';

    /**
     * A DLX node include six attr:
     *   - (up, down, left, right)
     *   - (col, row)
     *
     * @constructor
     */
    var Node = function (col, row) {
        // position
        this._col = _.isUndefined(col) ? -1 : col;
        this._row = _.isUndefined(row) ? -1 : row;

        this._up = null;
        this._down = null;
        this._left = null;
        this._right = null;
    };

    Node.prototype.up = function (node) {
        return this.decide('up', node);
    };

    Node.prototype.down = function (node) {
        return this.decide('down', node);
    };

    Node.prototype.left = function (node) {
        return this.decide('left', node);
    };

    Node.prototype.right = function (node) {
        return this.decide('right', node);
    };

    Node.prototype.col = function (value) {
        return this.decide('col', value);
    };

    Node.prototype.row = function (value) {
        return this.decide('row', value);
    };

    Node.prototype.decide = function (key, value) {
        if (_.isUndefined(value)) {
            return this.get(key);
        }

        return this.set(key, value);
    };

    Node.prototype.get = function (key) {
        return this['_' + key];
    };

    Node.prototype.set = function (key, value) {
        this['_' + key] = value;
        return this;
    };

    /**
     * ==================== end node =====================
     */

    var DancingLinkX = function (cols, origin) {
        this.cols = cols; // total columns
        this.origin = origin;

        /*
         * ==================== DLX =====================
         */

        // an [][cols]
        this.nodes = [];
        this.answer = [];
        this.head = new Node(-1, -1);

        /*
         * ==================== build helper =====================
         */

        // length = cols,
        // last row index in this column
        this.lastIndex = [];

        // node count in this column
        this.countOfColumn = [];

        // init headers
        this.init();
    };

    DancingLinkX.prototype.init = function () {
        this.initHeader();
        this.addRows();
    };

    DancingLinkX.prototype.initHeader = function () {
        var headers = [];
        for (var i = 0; i < this.cols; i++) {
            headers.push(new Node(i, 0));
        }

        for (var j = 0; j < this.cols; j++) {
            var leftIndex = j === 0 ? this.cols - 1 : (j - 1);
            var rightIndex = j === (this.cols - 1) ? 0 : (j + 1);
            headers[j]
                .right(headers[rightIndex])
                .left(headers[leftIndex]);
        }

        this.nodes.push(headers);
    };

    DancingLinkX.prototype.addRows = function () {
        // init column count set 0
        for(var m = 0; m < this.cols; m++) {
            this.countOfColumn[m] = 0;
        }

        _.each(this.origin, function (row) {
            this.addRow(row);
        }, this);
    };

    DancingLinkX.prototype.addRow = function (row) {
        var len = this.nodes.length;

        // init row and set (col, row)
        var nodes = _.map(row, function (index) {
            return new Node(index, len);
        }, this);

        // set "up, down, left, right"
        _.each(nodes, function (node, i) {
            var leftIndex = i === 0 ? (nodes.length - 1) : (i - 1);
            var rightIndex = i === (nodes.length - 1) ? 0 : (i + 1);

            var curCol = node.col();
            var headerNode = this.nodes[0][curCol];

            var upIndex = this.lastIndex[curCol] || 0; // get the last index or 0 ( header );
            var upNode = (upIndex === 0)
                       ? this.nodes[upIndex][curCol] // get header node directly.
                       : _.find(this.nodes[upIndex], function (item) {
                            return item.col() === curCol;
                        });

            node.right(nodes[rightIndex])
                .left(nodes[leftIndex])
                .up(upNode) // decide by lastIndex[curCol]
                .down(headerNode); // point to "header(row = 0)" by default

            upNode.down(node);
            headerNode.up(node);

            this.lastIndex[curCol] = len; // update the index of node in this column
            this.countOfColumn[curCol]++;
        }, this);

        this.nodes.push(nodes);
    };

    DancingLinkX.prototype.getIndexOfLeastCountColumn = function () {
        var index;
        var minCount;
        var curCount;

        for (var i = 0; i < this.countOfColumn.length; i++) {
            curCount = this.countOfColumn[i];
            if (curCount === 0) {
                continue;
            }

            if (!minCount) {
                minCount = curCount;
                index = i;
                continue;
            }

            if (curCount < minCount) {
                minCount = curCount;
                index = i;
            }
        }

        return index;
    };

    DancingLinkX.prototype.headToIndex = function (index) {
        this.headTo(this.nodes[0][index]);
    };

    DancingLinkX.prototype.headTo = function (node) {
        this.head.right(node);
        this.head.left(node.left());

        node.left().right(this.head);
        node.left(this.head);
    };

    DancingLinkX.prototype.dance = function () {
        //console.log('current head point to:', this.head.right());
        var headRightNode = this.head.right();
        if (headRightNode === this.head) {
            // success
            return true;
        }

        // head to the least column
        var index = this.getIndexOfLeastCountColumn();
        console.log('current least column:', index);
        if (index === -1) {
            return false;
        }

        this.headToIndex(index);

        headRightNode = this.head.right();
        this.remove(headRightNode);

        var downNode = headRightNode.down(), rightNode, leftNode;
        while (downNode !== headRightNode) {
            this.answer.push(downNode.row());

            rightNode = downNode.right();
            while (rightNode !== downNode) {
                //console.log('________current remove:', rightNode);
                this.remove(this.nodes[0][rightNode.col()]);
                rightNode = rightNode.right();
            }

            if (this.dance()) {
                return true;
            }

            this.answer.pop();

            leftNode = downNode.left();
            while (leftNode !== downNode) {
                //console.log('________current restore:', leftNode);
                this.restore(this.nodes[0][leftNode.col()]);
                leftNode = leftNode.left();
            }

            downNode = downNode.down();
        }

        this.restore(headRightNode);
        return false;
    };

    /**
     * @param node on header
     */
    DancingLinkX.prototype.remove = function (node) {
        //console.log('current remove:', node);
        node.left().right(node.right());
        node.right().left(node.left());

        var downNode = node.down(),
            rightNode;
        while (downNode !== node) {
            rightNode = downNode.right();
            while (rightNode !== downNode) {
                //console.log('____current remove:', rightNode);
                rightNode.up().down(rightNode.down());
                rightNode.down().up(rightNode.up());
                rightNode = rightNode.right();

                this.countOfColumn[node.col()]--;
            }

            downNode = downNode.down();
        }
    };

    DancingLinkX.prototype.restore = function (node) {
        //console.log('current restore:', node);
        node.left().right(node);
        node.right().left(node);

        var upNode = node.up(),
            rightNode;
        while (upNode !== node) {
            rightNode = upNode.right();
            while (rightNode !== upNode) {
                //console.log('____current restore:', rightNode);
                rightNode.up().down(rightNode);
                rightNode.down().up(rightNode);
                rightNode = rightNode.right();

                this.countOfColumn[node.col()]++;
            }

            upNode = upNode.up();
        }
    };

    DancingLinkX.prototype.render = function () {
        var $table = $('<table class="table table-bordered"></table>');

        var headers = _.range(this.cols);
        var $header = $('<tr></tr>');
        _.each(headers, function(item) {
            $header.append($('<th>' + item + '</th>'));
        });
        $table.append($header);

        _.each(this.origin, function (row) {
            var $row = $('<tr></tr>');
            var i;
            var lastIndex = 0;

            // add 0
            if (row[0] !== 0) {
                $row.append($('<td> </td>'));
            }

            _.each(row, function(index) {
                if (index !== 0) {
                    for (i = lastIndex + 1; i < index; i++) {
                        $row.append($('<td> </td>'));
                    }
                }

                $row.append($('<td> 1 </td>'));
                lastIndex = index;
            }, this);

            var lastIndex = _.last(row);
            if (lastIndex !== this.cols - 1) {
                for (i = lastIndex + 1; i < this.cols; i++) {
                    $row.append($('<td> </td>'));
                }
            }

            $table.append($row);
        }, this);

        $('#dlk').empty().append($table);
    };

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
        this.mapping();

        this.dlx = new DancingLinkX(324, this.dlxArr); // 81 * 4
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

    // [1, 2, 3, 4, 5, 6, 7, 8, 9];
    var nines = _.range(1, 10);

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

    Sudoku.prototype.mapping = function () {
        var i, j, len = this.origin.length;

        for (i = 0; i < len; i++) {
            var row = this.origin[i];
            for (j = 0; j < row.length; j++) {
                var n = row[j]; // number at this position.
                if (n === 0) {
                    var avails = this.available(j, i); // calculate available number at this position
                    //console.log('(', j, ',', i, ')', avails);

                    if (avails.length === 1) {
                        this.origin[i][j] = avails[0];
                    }
                }
            }
        }

        for (i = 0; i < len; i++) {
            var row = this.origin[i];
            for (j = 0; j < row.length; j++) {
                var n = row[j]; // number at this position.
                if (n !== 0) {
                    this.add(j, i, n);
                }
            }
        }

        for (i = 0; i < len; i++) {
            var row = this.origin[i];
            for (j = 0; j < row.length; j++) {
                var n = row[j]; // number at this position.
                if (n === 0) {
                    var avails = this.available(j, i); // calculate available number at this position
                    //console.log('(', j, ',', i, ')', avails);

                    _.each(avails, function (k) {
                        this.add(j, i, k);
                    }, this);
                }
            }
        }
    };

    Sudoku.prototype.add = function (x, y, n) {
        //console.log('add (', x, ',', y, ')', n);
        this.dlxArr.push([
            this.toIndex(x, y),
            this.toRowIndex(y, n),
            this.toColIndex(x, n),
            this.toBoxIndex(x, y, n)
        ]);
    };

    Sudoku.prototype.resolve = function () {
        this.dlx.dance();
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

    var sudo = [
        [6, 9, 0, 0, 0, 5, 1, 0, 0],
        [0, 0, 0, 0, 1, 3, 8, 0, 0],
        [1, 0, 0, 0, 0, 2, 0, 0, 0],
        [4, 7, 3, 0, 0, 0, 6, 5, 0],
        [0, 0, 5, 0, 9, 0, 0, 7, 0],
        [9, 6, 0, 0, 5, 0, 4, 0, 8],
        [3, 0, 0, 2, 0, 8, 7, 0, 5],
        [2, 0, 4, 0, 0, 6, 0, 8, 0],
        [0, 0, 0, 0, 3, 0, 2, 0, 0]
    ];

    var cusotm1 = [
        [6, 0, 0, 0, 0, 5, 0, 0, 0],
        [0, 0, 0, 0, 1, 3, 8, 0, 0],
        [0, 0, 0, 0, 0, 2, 0, 0, 0],
        [4, 0, 3, 0, 0, 0, 6, 5, 0],
        [0, 0, 5, 0, 9, 0, 0, 7, 0],
        [9, 6, 0, 0, 5, 0, 0, 0, 8],
        [0, 0, 0, 0, 0, 8, 0, 0, 5],
        [2, 0, 0, 0, 0, 6, 0, 8, 0],
        [0, 0, 0, 0, 3, 0, 2, 0, 0]
    ];

    var veryDifficult1 = [
        [0, 0, 9, 0, 0, 0, 0, 0, 0],
        [6, 0, 0, 0, 4, 0, 0, 3, 0],
        [0, 0, 7, 6, 0, 0, 0, 2, 0],
        [3, 0, 0, 0, 0, 2, 1, 0, 0],
        [0, 0, 5, 9, 0, 0, 7, 0, 0],
        [0, 0, 8, 0, 0, 0, 0, 0, 5],
        [0, 1, 0, 0, 0, 4, 9, 0, 0],
        [0, 9, 0, 0, 7, 0, 0, 0, 6],
        [0, 0, 0, 0, 0, 0, 8, 0, 0]
    ];

    var third = [
        [8, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 3, 6, 0, 0, 0, 0, 0],
        [0, 7, 0, 0, 9, 0, 2, 0, 0],
        [0, 5, 0, 0, 0, 7, 0, 0, 0],
        [0, 0, 0, 0, 4, 5, 7, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 3, 0],
        [0, 0, 1, 0, 0, 0, 0, 6, 8],
        [0, 0, 8, 5, 0, 0, 0, 1, 0],
        [0, 9, 0, 0, 0, 0, 4, 0, 0]
    ];

    //var test = [
    //    [2, 4, 5],
    //    [0, 3, 6],
    //    [1, 2, 5],
    //    [0, 3],
    //    [1, 6],
    //    [3, 4, 6]
    //];
    //
    //var dlx = window.dlx = new DancingLinkX(7, test);
    //dlx.render();

    //// var start = new Date();
    //var sudoku = new Sudoku(third);
    //sudoku.dlx.render();

    //console.log('mapping cost:', (new Date() - start));
    //sudoku.resolve();
    //console.log('resolve cost:', (new Date() - start));

    //console.log('dlx array length:', sudoku.dlxArr.length);
    //console.log('result length:', sudoku.dlx.answer.length);

    /* use node */
    //$ node js/dancing-link-x.js
    //mapping cost: 64
    //resolve cost: 146223 -> 146s -> 2min 26s

    /* use chrome 46 */
    //2015-12-01 02:06:43.957 dancing-link-x.js:486 mapping cost: 20
    //2015-12-01 02:10:07.204 dancing-link-x.js:493 resolve cost: 203244 -> 203s -> 3min 23s

    return Sudoku;
}));
