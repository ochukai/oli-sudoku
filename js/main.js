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

    var Sudoku = function(sodu) {
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

        this.origin = sodu || dummy;
        this.nines = [1, 2, 3, 4, 5, 6, 7, 8, 9];

        this.availableArray = [];
    };

    /**
     * get available numbers in the (row, col)
     *
     * @param x 0-8 index of col
     * @param y 0-8 index of row
     */
    Sudoku.prototype.availables = function(x, y) {
        var related = _.union(this.origin[y]);

        // get col
        _.each(this.origin, function(row) {
            related.push(row[x]);
        });

        // get square
        var rangeX = range(x);
        var rangeY = range(y);
        for (var i = rangeY[0]; i <= rangeY[1]; i++ ) {
            for (var j = rangeX[0]; j <= rangeX[1]; j++) {
                related.push(this.origin[i][j]);
            }
        }

        return _.difference(this.nines, related);
    };



    Sudoku.prototype.calculateAvailable = function() {
        this.availableArray = [];

        _.each(this.origin, function(row, i) {
            _.each(row, function(num, j) {
                if (num !== 0) {
                    return;
                }

                var avails = this.availables(j, i);
                console.log('(', j, ',', i, ')', avails);

                this.availableArray.push({
                    x: j,
                    y: i,
                    avails: avails,
                    count: avails.length
                });
            }, this);
        }, this);
    };

    Sudoku.prototype.sortByCount = function() {
        return _.sortBy(this.availableArray, function(item) {
            return item.count;
        }, this);
    };

    Sudoku.prototype.groupByCount = function() {
        return _.groupBy(this.availableArray, function(item) {
            return item.count;
        }, this);
    };

    Sudoku.prototype.toLastState = function() { };

    Sudoku.prototype.fillOne = function(x, y, value) {
        this.origin[y][x] = value;
    };

    Sudoku.prototype.parse = function() {
        this.calculateAvailable();
        var groups = this.groupByCount();

        var zeroGroup = groups['0'];
        if (zeroGroup && zeroGroup.length > 0) {
            this.toLastState();
        }

        var oneGroup = groups['1'];
        if (oneGroup && oneGroup.length > 0) {
            _.each(oneGroup, function(item) {
                this.fillOne(item.x, item.y, item.avails[0]);
            }, this);
        } else {
            // TODO random fill.
        }
    };

    Sudoku.prototype.render = function () {
        var $table = $('<table class="table table-bordered"></table>');

        _.each(this.origin, function(row) {
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

    window.sudoku = new Sudoku();

    $(function() {
        var sudoku = window.sudoku || {};
        sudoku.render();

        $('#calculate').on('click', function() {
            //sudoku.calculateAvailable();
            //console.log('------------------------total:', sudoku.availableArray.length, '--------------------------');
            sudoku.parse();
            sudoku.render();
        });

    });

})(jQuery, _);