(function ($, _) {
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

        this._up    = null;
        this._down  = null;
        this._left  = null;
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

    /**
     * The columns represent the constraints of the puzzle. In Sudoku, we have 4:
     *   - A position constraint: Only 1 number can occupy a cell
     *   - A row constraint: Only 1 instance of a number can be in the row
     *   - A column constraint: Only 1 instance of a number can be in a column
     *   - A region constraint: Only 1 instance of a number can be in a region
     * Therefore there are SIZE^2 * 4 columns, where SIZE is the number of candidates/rows/cols.
     * In a 9 x 9, there are 324 columns.
     *
     * The rows represent every single possible position for every number.
     * Therefore, there are SIZE^3 rows.
     * In a 9 x 9, this would be 729 rows.
     */
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

    DancingLinkX.prototype.headTo = function(node) {
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

    //DancingLinkX.prototype.traverse = function () { };
    //DancingLinkX.prototype.render = function () { };

    $(function () {

        var start = new Date();

        var dlk = window.dlk = new DancingLinkX(7);
        dlk.addRow([2, 4, 5]);
        dlk.addRow([0, 3, 6]);
        dlk.addRow([1, 2, 5]);
        dlk.addRow([0, 3]);
        dlk.addRow([1, 6]);
        dlk.addRow([3, 4, 6]);
        console.log('add row cost:', (new Date() - start));
        dlk.dance();

        console.log('total cost:', (new Date() - start));
        console.log(dlk.answer);

        //2015-11-30 01:20:15.898 dancing-link-x.js:269 add row cost: 2
        //2015-11-30 01:20:15.905 dancing-link-x.js:272 total cost: 9
        //2015-11-30 01:20:15.906 dancing-link-x.js:273 [4, 5, 1]
    });

})(jQuery, _);