(function ($, _) {

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

    function deepCopy(arr) {
        return _.map(arr, function (row) {
            return _.map(row, function (item) {
                return item;
            });
        });
    }

    var Sudoku = function (soduku) {
        var dummy = [
            [0, 0, 0, 0, 3, 4, 8, 0, 1],
            [4, 0, 0, 0, 0, 0, 7, 0, 0],
            [0, 3, 0, 8, 7, 0, 0, 2, 4],
            [8, 7, 0, 0, 0, 0, 0, 0, 0],
            [2, 0, 0, 5, 4, 1, 0, 0, 8],
            [0, 0, 0, 0, 0, 0, 0, 4, 2],
            [3, 1, 0, 0, 8, 7, 0, 9, 0],
            [0, 0, 9, 0, 0, 0, 0, 0, 7],
            [7, 0, 6, 4, 9, 0, 0, 0, 0]
        ];

        this.origin = soduku || dummy;
        // [1, 2, 3, 4, 5, 6, 7, 8, 9];
        this.nines = _.range(1, 10);

        this.snapshots = [];
        this.currentState = {
            sudoku: deepCopy(this.origin)
            // target:
            // index:
            // avails:
        };
    };

    Sudoku.prototype.push = function () {
        this.snapshots.push({
            sudoku: deepCopy(_.result(this.currentState, 'sudoku')),
            index: _.result(this.currentState, 'index'),
            target: _.result(this.currentState, 'target')
        });

        delete this.currentState.index;
        delete this.currentState.target;

        console.log('snapshot length:', this.snapshots.length);
    };

    Sudoku.prototype.pop = function () {
        return this.snapshots.pop();
    };

    Sudoku.prototype.toLastState = function () {
        this.currentState = this.pop();
        console.log('unsolvable, to last state, length:', this.snapshots.length);

        this.tryNext();
    };

    /**
     * get available numbers in the (row, col)
     *
     * @param x 0-8 index of col
     * @param y 0-8 index of row
     */
    Sudoku.prototype.available = function (x, y) {
        var target = this.currentState.sudoku;
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

        return _.difference(this.nines, related);
    };

    Sudoku.prototype.calculate = function () {
        if (_.isUndefined(this.currentState)) {
            console.log('over');
            return;
        }

        var dummy = [];
        var target = this.currentState.sudoku;
        this.currentState.hasBlank = false;

        // break    -- return false;
        // continue -- return true;﻿
        _.each(target, function (row, i) {
            _.each(row, function (num, j) {
                if (num !== 0) {
                    return;
                }

                this.currentState.hasBlank = true;

                var avails = this.available(j, i);
                dummy.push({
                    x: j,
                    y: i,
                    avails: avails,
                    count: avails.length
                });

                //console.log('(', j, ',', i, ')', avails);
            }, this);
        }, this);

        this.currentState.avails = dummy;
        this.sort();
    };

    Sudoku.prototype.sort = function () {
        var dummy = this.currentState.avails;
        this.currentState.avails = _.sortBy(dummy, function (item) {
            return item.count;
        }, this);
    };

    Sudoku.prototype.hasBlank = function () {
        return this.currentState.hasBlank;
    };

    /**
     * return if this current state could be solved.
     *
     * @returns {boolean}
     */
    Sudoku.prototype.unsolvable = function () {
        return _.any(this.currentState.avails, function (item) {
            return item.count === 0;
        });
    };

    /**
     * array contains item which avails count = 1
     *
     * @returns []
     */
    Sudoku.prototype.ones = function () {
        return _.filter(this.currentState.avails, function (item) {
            return item.count === 1;
        });
    };

    /**
     *
     * @returns {*}
     */
    Sudoku.prototype.hasOne = function () {
        return _.any(this.currentState.avails, function (item) {
            return item.count === 1;
        });
    };

    Sudoku.prototype.fill = function () {
        this.calculate();

        while (this.hasBlank()) {
            if (this.unsolvable()) {
                this.toLastState();
            } else if (this.hasOne()) {
                this.fillOnes();
            } else {
                this.fillMulti();
            }

            this.calculate();
        }

        console.log('end.');
    };

    Sudoku.prototype.tryNext = function () {
        var dummy = this.currentState.target;

        var x = dummy.x;
        var y = dummy.y;

        this.currentState.index++;
        var index = this.currentState.index;
        if (index === dummy.avails.length) {
            // unsolvable
            this.toLastState();
            return;
        }

        this.push();

        var currentValue = dummy.avails[index];
        this.fillOne(x, y, currentValue);

        console.log('try (', x, ',', y, ') avails[', index, '] =', currentValue);
    };

    Sudoku.prototype.fillMulti = function () {
        if (_.isUndefined(this.currentState.target)) {
            this.currentState.target = _.first(this.currentState.avails);
        }

        var index = _.isUndefined(this.currentState.index) ? -1 : this.currentState.index;
        this.currentState.index = index;

        this.tryNext();
    };

    Sudoku.prototype.fillOnes = function () {
        var ones = this.ones();
        _.each(ones, function (item) {
            this.fillOne(item.x, item.y, item.avails[0]);
        }, this);
    };

    Sudoku.prototype.fillOne = function (x, y, value) {
        this.currentState.sudoku[y][x] = value;
    };

    Sudoku.prototype.render = function () {
        var $table = $('<table class="table table-bordered"></table>');

        _.each(this.currentState.sudoku, function (row) {
            var $row = $('<tr></tr>');
            _.each(row, function (num) {
                if (num === 0) {
                    num = ' ';
                }

                $row.append($('<td>' + num + '</td>'));
            });
            $table.append($row);
        });

        $('.sudoku-wrapper').empty().append($table);
    };

    $(function () {

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
        var sudoku = new Sudoku(veryDifficult1);
        sudoku.render();

        $('#calculate').on('click', function () {
            var start = new Date();
            sudoku.fill();
            sudoku.render();

            console.log('spend:', (new Date() - start));
        });

    });

})(jQuery, _);