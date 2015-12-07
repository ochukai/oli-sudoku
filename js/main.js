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

    /**
     * square:
     *  11, 21, 31
     *  12, 22, 32
     *  13, 23, 33
     *
     * @param x
     * @param y
     * @returns {*} current pos
     */
    function square(x, y) {
        var pos = function (n) {
            return Math.ceil((n + 1) / 3);
        };

        return pos(x) * 10 + pos(y);
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

        this.parse();
    };

    Sudoku.prototype.push = function () {
        this.snapshots.push({
            sudoku: deepCopy(_.result(this.currentState, 'sudoku')),
            index: _.result(this.currentState, 'index'),
            target: _.clone(_.result(this.currentState, 'target'))
        });

        // clear current state
        delete this.currentState.index;
        delete this.currentState.target;

        //console.log('snapshot length:', this.snapshots.length);
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

    Sudoku.prototype.parse = function () {
        //console.log('----------------------- begin parse ---------------------------');

        this.currentState.hasBlank = false;
        this.currentState.hasZeros = false;

        var dummy = [];
        var target = this.currentState.sudoku;

        for (var i = 0; i < target.length; i++) {
            var row = target[i];
            if (this.currentState.hasZeros) {
                break;
            }

            for (var j = 0; j < row.length; j++) {
                var num = row[j];
                if (num !== 0) {
                    continue;
                }

                this.currentState.hasBlank = true;

                var avails = this.available(j, i);
                if (avails.length === 0) {
                    this.currentState.hasZeros = true;
                    break;
                }

                dummy.push({
                    x: j,
                    y: i,
                    square: square(j, i),
                    avails: avails,
                    count: avails.length
                });

                //console.log('(', j, ',', i, ')', avails);
            }
        }

        //console.log('------------- after parse before check ----', dummy.length, '----------------');

        this.currentState.avails = dummy;
        this.sort();

        if (!this.check()) {
            this.toLastState();
            this.parse();
        }
    };

    Sudoku.prototype.check = function () {
        var ones = this.ones();
        if (ones.length <= 1) {
            return true;
        }

        var grouped = _.groupBy(ones, function (item) {
            return item.avails[0];
        });

        if (_.keys(grouped).length === ones.length) {
            return true
        }

        var multi = _.filter(_.values(grouped), function (items) {
            return items.length > 1;
        });

        var valid = true;
        _.each(multi, function (items) {
            var len = items.length;

            // not in same column
            var xs = _.uniq(_.map(items, function (item) {
                return item.x;
            }));

            if (xs.length !== len) {
                //console.log('error in same column', items);
                valid = false;
                return false;
            }

            // not in same row
            var ys = _.uniq(_.map(items, function (item) {
                return item.y;
            }));

            if (ys.length !== len) {
                //console.log('error in same row', items);
                valid = false;
                return false;
            }

            // not in same square
            var squares = _.uniq(_.map(items, function (item) {
                return item.square;
            }));

            if (squares.length !== len) {
                //console.log('error in same square', items);
                valid = false;
                return false;
            }

        }, this);

        return valid;
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
        //console.log('unsolvable, to last state, length:', this.snapshots.length);
        this.tryNext();
    };

    Sudoku.prototype.fill = function () {
        while (this.hasBlank()) {
            if (this.unsolvable()) {
                this.toLastState();
            } else if (this.hasOne()) {
                this.fillOnes();
            } else {
                this.fillMulti();
            }

            this.parse();
        }
    };

    Sudoku.prototype.fillManually = function () {
        if (this.hasBlank()) {
            if (this.unsolvable()) {
                this.toLastState();
            } else if (this.hasOne()) {
                this.fillOnes();
            } else {
                this.fillMulti();
            }
        }

        this.parse();
    };

    Sudoku.prototype.tryNext = function () {
        var dummy = this.currentState.target;

        var index = ++this.currentState.index;
        if (index === dummy.avails.length) {
            this.toLastState();
            return;
        }

        this.push();

        //console.log('try (', dummy.x, ',', dummy.y, ') avails[', index, '] =', dummy.avails[index]);
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
        //console.log('ones exist.');
        _.each(this.ones(), function (item) {
            this.fillOne(item.x, item.y, item.avails[0]);
        }, this);
    };

    Sudoku.prototype.fillOne = function (x, y, value) {
        //console.log('fill (', x, ',' , y, ') =', value);
        this.currentState.sudoku[y][x] = value;
    };

    Sudoku.prototype.render = function () {
        var $table = $('<table class="table table-bordered"></table>');
        $table.append('<tr><th>-</th><th>0</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th></tr>');
        _.each(this.currentState.sudoku, function (row, i) {
            var $row = $('<tr></tr>');
            $row.append('<th>' + i + '</th>');
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

        var easy1 = [
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

        var sudoku = new Sudoku(third);
        sudoku.render();

        $('#calculate').on('click', function () {
            sudoku = new Sudoku(third);
            sudoku.render();

            setTimeout(function () {
                var start = new Date();
                sudoku.fill();
                console.log('spend:', (new Date() - start));

                sudoku.render();
            }, 1000);
        });

        $('#calculate-manually').on('click', function () {
            sudoku.fillManually();
            sudoku.render();
        });
    });

})(jQuery, _);