(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        //define(['jquery', 'underscore'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS style for Browserify/Seajs
        var $ = require('jquery');
        var _ = require('underscore');
        module.exports = factory($, _);
    } else {
        // Browser globals
        //factory(jQuery, _);
        factory();
    }
}(function () {
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
        this.cols = cols;
        this.origin = origin;

        /*
         * ==================== DLX =====================
         */

        // an [][cols]
        this.nodes = [];

        this.head = new Node(-1, -1);
        this.answer = [];

        /*
         * build helper
         */

        // length = cols,
        // last index in this column
        this.lastIndex = [];

        // init headers
        this.init();
    };

    DancingLinkX.prototype.init = function () {
        // init header
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
        this.headTo(this.nodes[0][0])
    };

    DancingLinkX.prototype.headTo = function (node) {
        this.head.right(node);
        this.head.left(node.left());

        node.left().right(this.head);
        node.left(this.head);
    };

    DancingLinkX.prototype.addRow = function (indexs) {
        var len = this.nodes.length;

        // init row and set (col, row)
        var row = _.map(indexs, function (index) {
            return new Node(index, len);
        }, this);

        // set "up, down, left, right"
        _.each(row, function (node, i) {
            var leftIndex = i === 0 ? (row.length - 1) : (i - 1);
            var rightIndex = i === (row.length - 1) ? 0 : (i + 1);

            var curCol = node.col();
            var headerNode = this.nodes[0][curCol];

            var upIndex = this.lastIndex[curCol] || 0; // get the last index or 0 ( header );
            var upNode = _.find(this.nodes[upIndex], function (item) {
                return item.col() === curCol;
            });

            node.right(row[rightIndex])
                .left(row[leftIndex])
                .up(upNode) // decide by lastIndex[curCol]
                .down(headerNode); // point to "header(row = 0)" by default

            upNode.down(node);
            headerNode.up(node);

            this.lastIndex[curCol] = len; // update the index of node in this column
        }, this);

        this.nodes.push(row);
    };

    DancingLinkX.prototype.dance = function () {
        //console.log('current head point to:', this.head.right());
        var headRightNode = this.head.right();
        if (headRightNode === this.head) {
            // success
            return true;
        }

        this.remove(headRightNode);

        var downNode = headRightNode.down(),
            rightNode,
            leftNode;

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
            }

            upNode = upNode.up();
        }
    };

    /**
     * The columns represent the constraints of the puzzle. In Sudoku, we have 4:
     *
     *   # A position constraint: Only 1 number can occupy a cell
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
     *   # A region constraint: Only 1 instance of a number can be in a region
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
     * Therefore there are SIZE^2 * 4 columns, where SIZE is the number of candidates/rows/cols.
     * In a 9 x 9, there are 324 columns.
     *
     * The rows represent every single possible position for every number.
     * Therefore, there are SIZE^3 rows.
     * In a 9 x 9, this would be 729 rows.
     */
    var Sudoku = function () {
        this.dlx = new DancingLinkX(324); // 81 * 4
        this.dlxArr = [];
    };

    Sudoku.prototype.mapping = function () {
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

        for (var i = 0; i < sudo.length; i++) {
            var row = sudo[i];
            for (var j = 0; j < row.length; j++) {
                var n = row[j]; // number at this position.
                if (n !== 0) {
                    this.add(j, i, n);
                } else { // number at this position is 0.
                    for (var k = 1; k <= 9; k++) { // 1 - 9 are possible at this position.
                        this.add(j, i, k);
                    }
                }
            }
        }
    };

    Sudoku.prototype.add = function(x, y, n) {
        this.dlxArr.push([
            this.toIndex(x, y),
            this.toColIndex(x, n),
            this.toRowIndex(y, n),
            this.toBoxIndex(x, y, n)
        ]);
    };

    Sudoku.prototype.addToDLX = function() {
        _.each(this.dlxArr, function(items) {
            this.dlx.addRow(items);
        }, this);
    };

    Sudoku.prototype.resolve = function() {
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
    Sudoku.prototype.toIndex = function(x, y) {
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
    Sudoku.prototype.toRowIndex = function(y, n) {
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
    Sudoku.prototype.toColIndex = function(x, n) {
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
    Sudoku.prototype.toBoxIndex = function(x, y, n) {
        return this.xyToBox(x, y) * 9 + n + 242
    };

    Sudoku.prototype.xyToBox = function(x, y) {
        return Math.floor(y / 3) * 3 + Math.floor(x / 3);
    };

    //var start = new Date();
    //
    //var dlx = window.dlx = new DancingLinkX(7);
    //dlx.addRow([2, 4, 5]);
    //dlx.addRow([0, 3, 6]);
    //dlx.addRow([1, 2, 5]);
    //dlx.addRow([0, 3]);
    //dlx.addRow([1, 6]);
    //dlx.addRow([3, 4, 6]);
    //console.log('add row cost:', (new Date() - start));
    //dlx.dance();
    //console.log('total cost:', (new Date() - start));
    //console.log(dlx.answer);
    //
    //2015-11-30 01:20:15.898 dancing-link-x.js:269 add row cost: 2
    //2015-11-30 01:20:15.905 dancing-link-x.js:272 total cost: 9
    //2015-11-30 01:20:15.906 dancing-link-x.js:273 [4, 5, 1]

    var mappingStart = new Date();
    var sudoku = new Sudoku();
    sudoku.mapping();
    sudoku.addToDLX();
    console.log('mapping cost:', (new Date() - mappingStart));
    //console.log(sudoku.dlxArr);
    //console.log(sudoku.dlx.nodes);

    var resolveStart = new Date();
    sudoku.resolve();
    console.log('resolve cost:', (new Date() - resolveStart));

    console.log(sudoku.dlx.answer.length);

    /* use node */
    //$ node js/dancing-link-x.js
    //mapping cost: 64
    //resolve cost: 146223 -> 146s -> 2min 26s

    /* use chrome 46 */
    //2015-12-01 02:06:43.957 dancing-link-x.js:486 mapping cost: 20
    //2015-12-01 02:10:07.204 dancing-link-x.js:493 resolve cost: 203244 -> 203s -> 3min 23s
    
    return Sudoku;
}));
