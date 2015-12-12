(function ($, _) {

    var OkuBuilder = function (sudoku) {
        this.sudoku = sudoku;
        this.highlightBoxs = [0,2,4,6,8];
    };

    OkuBuilder.prototype.render = function () {
        var $table = $('<table class="table table-bordered"></table>');

        _.each(this.sudoku, function (row, i) {
            var $row = $('<tr></tr>');

            _.each(row, function (num, j) {
                var $td = this.formatTd(j, i, num);
                $row.append($td);
            }, this);

            $table.append($row);
        }, this);

        $('.sudoku-wrapper').empty().append($table);
    };

    OkuBuilder.prototype.formatTd = function (x, y, number) {
        var box = this.xyToBox(x, y);
        var $td = $('<td></td>').data({
            x: x,
            y: y,
            box: box
        });

        if (number === 0) {
            number = ' ';
            $td.addClass('empty');
        } else {
            $td.addClass('original');
        }

        if (this.shouldHighlight(box)) {
            $td.addClass('highlight');
        }

        $td.text(number);
        return $td;
    };

    OkuBuilder.prototype.shouldHighlight = function (box) {
        return _.contains(this.highlightBoxs, box);
    };

    /**
     *  | box -> 0 1 2
     *  |     -> 3 4 5
     *  |     -> 6 7 8
     *
     * @param x
     * @param y
     * @returns {number}
     */
    OkuBuilder.prototype.xyToBox = function (x, y) {
        return Math.floor(y / 3) * 3 + Math.floor(x / 3);
    };

    OkuBuilder.prototype.markRelated = function (data) {
        $('.sudoku-wrapper td').each(function() {
            var $this = $(this);
            var curData = $this.data();
            if (curData.x === data.x || curData.y === data.y || curData.box === data.box) {
                $this.addClass('active-related');
            }
        });
    };

    OkuBuilder.prototype.initEvents = function () {
        var self = this;
        $(document).on('click', function() {
            $('.sudoku-wrapper td')
                .removeClass('active')
                .removeClass('active-related');
        });

        $('.sudoku-wrapper').on('click', 'td.empty', function () {
            var $this = $(this);

            $this.parents('table').find('td')
                .removeClass('active')
                .removeClass('active-related');
            self.markRelated($this.data());
            $this.addClass('active');

            return false;
        });

        $('.tips').on('click', 'td', function () {
            var $this = $(this);
            var $active = $('.sudoku-wrapper td.active');
            $active.text($this.text());

            return false;
        });

    };

    $(function () {

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

        var builder = new OkuBuilder(third);
        builder.render();
        builder.initEvents();

    });

})(jQuery, _);
