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
        // [1, 2, 3, 4, 5, 6, 7, 8, 9];
        this.nines = _.range(1, 10);

        this.origin = soduku;

        // a stack save every state.
        this.snapshots = [];

        this.currentState = {};
        this.currentState.sudoku = deepCopy(this.origin);
    };

    Sudoku.prototype.push = function () {
        this.snapshots.push({
            sudoku: deepCopy(_.result(this.currentState, 'sudoku')),
            index: _.result(this.currentState, 'index'),
            target: _.result(this.currentState, 'target')
        });

        // clear current state
        delete this.currentState.index;
        delete this.currentState.target;
    };

    Sudoku.prototype.pop = function () {
        return this.snapshots.pop();
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
        this.currentState.hasBlank = false;
        this.currentState.hasZeros = false;

        var dummy = [];
        var target = this.currentState.sudoku;

        _.each(target, function (row, i) {
            if (this.currentState.hasZeros) {
                return false;  // break: return false;
            }

            _.each(row, function (num, j) {
                if (num !== 0) {
                    return;
                }

                this.currentState.hasBlank = true;

                var avails = this.available(j, i);
                if (avails.length === 0) {
                    this.currentState.hasZeros = true;
                    return false; // break
                }

                dummy.push({
                    x: j,
                    y: i,
                    avails: avails,
                    count: avails.length
                });
            }, this);
        }, this);

        this.currentState.avails = dummy;
        this.sort();
    };

    Sudoku.prototype.sort = function () {
        this.currentState.avails = _.sortBy(this.currentState.avails, function (item) {
            return item.count;
        });
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
        return this.currentState.hasZeros;
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

    Sudoku.prototype.hasOne = function () {
        return _.any(this.currentState.avails, function (item) {
            return item.count === 1;
        });
    };

    Sudoku.prototype.toLastState = function () {
        this.currentState = this.pop();
        this.tryNext();
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
    };

    Sudoku.prototype.tryNext = function () {
        var dummy = this.currentState.target;

        var index = ++this.currentState.index;
        if (index === dummy.avails.length) {
            this.toLastState();
            return;
        }

        this.push();
        this.fillOne(dummy.x, dummy.y, dummy.avails[index]);
    };

    Sudoku.prototype.fillMulti = function () {
        if (_.isUndefined(this.currentState.target)) {
            this.currentState.target = _.first(this.currentState.avails);
        }

        if (_.isUndefined(this.currentState.index)) {
            this.currentState.index = -1;
        }

        this.tryNext();
    };

    Sudoku.prototype.fillOnes = function () {
        _.each(this.ones(), function (item) {
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
            sudoku = new Sudoku(veryDifficult1);
            sudoku.render();

            setTimeout(function() {
                var start = new Date();
                sudoku.fill();
                console.log('spend:', (new Date() - start));

                sudoku.render();
            }, 1000);
        });

    });

})(jQuery, _);