var _ = require('underscore');

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

DancingLinkX.prototype.getHeaderNodeOfLeastCountColumn = function () {
    if (!this.head.right()) {
        this.headToIndex(0);
    }

    var dummy = this.head.right();
    var min = dummy;
    while (dummy !== this.head) {
        if (this.countOfColumn[dummy.col()] < this.countOfColumn[min.col()]) {
            min = dummy
        }

        dummy = dummy.right();
    }

    return min;
};

DancingLinkX.prototype.headToIndex = function (index) {
    this.headTo(this.nodes[0][index]);
};

DancingLinkX.prototype.headTo = function (node) {
    if (this.head.right()) {
        this.head.right().left(this.head.left());
    }

    if(this.head.left()){
        this.head.left().right(this.head.right());
    }

    this.head.right(node);
    node.left().right(this.head);

    this.head.left(node.left());
    node.left(this.head);
};

DancingLinkX.prototype.dance = function () {
    var headRightNode = this.head.right();
    // console.log('---- current head right node:', headRightNode);
    if (headRightNode === this.head) {
        // success
        return true;
    }

    // head to the least column
    headRightNode = this.getHeaderNodeOfLeastCountColumn();
    // console.log('current least column:', headRightNode);
    if (this.countOfColumn[headRightNode.col()] < 1) {
        return false;
    }

    this.remove(headRightNode);

    var downNode = headRightNode.down(), rightNode, leftNode;
    while (downNode !== headRightNode) {
        this.answer.push(downNode.row());

        rightNode = downNode.right();
        while (rightNode !== downNode) {
            this.remove(this.nodes[0][rightNode.col()]);
            rightNode = rightNode.right();
        }

        if (this.dance()) {
            return true;
        }

        this.answer.pop();

        leftNode = downNode.left();
        while (leftNode !== downNode) {
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
    // console.log('current header node:', node);
    node.left().right(node.right());
    node.right().left(node.left());

    var downNode = node.down(),
        rightNode;
    while (downNode !== node) {
        rightNode = downNode.right();
        while (rightNode !== downNode) {
            // console.log('current remove:', rightNode);

            rightNode.up().down(rightNode.down());
            rightNode.down().up(rightNode.up());

            var col = rightNode.col();
            var oldCount = this.countOfColumn[col];
            this.countOfColumn[col] = oldCount - 1;
            // console.log(col, 'col\'s old count is', oldCount);

            rightNode = rightNode.right();
        }

        downNode = downNode.down();
    }
};

DancingLinkX.prototype.restore = function (node) {
    // console.log('current header node:', node);
    node.left().right(node);
    node.right().left(node);

    var upNode = node.up(),
        rightNode;
    while (upNode !== node) {
        rightNode = upNode.right();
        while (rightNode !== upNode) {
            // console.log('current restore:', rightNode);

            rightNode.up().down(rightNode);
            rightNode.down().up(rightNode);

            var col = rightNode.col();
            var oldCount = this.countOfColumn[col];
            this.countOfColumn[col] = oldCount + 1;
            // console.log(col, 'col\'s old count is', oldCount);

            rightNode = rightNode.right();
        }

        upNode = upNode.up();
    }
};

module.exports = DancingLinkX;