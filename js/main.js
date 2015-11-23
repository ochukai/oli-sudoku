(function ($) {

    function generate() {
        var dummy = [
            [1, 2, 3, 4, 5, 6, 7, 8, 9],
            [1, 2, 3, 4, 5, 6, 7, 8, 9],
            [1, 2, 3, 4, 5, 6, 7, 8, 9],
            [1, 2, 3, 4, 5, 6, 7, 8, 9],
            [1, 2, 3, 4, 5, 6, 7, 8, 9],
            [1, 2, 3, 4, 5, 6, 7, 8, 9],
            [1, 2, 3, 4, 5, 6, 7, 8, 9],
            [1, 2, 3, 4, 5, 6, 7, 8, 9],
            [1, 2, 3, 4, 5, 6, 7, 8, 9]
        ];

        var $table = $('<table class="table table-bordered"></table>');
        for (var i = 0; i < dummy.length; i++) {
            var row = dummy[i];
            var $row = $('<tr></tr>');
            for (var j = 0; j < row.length; j++) {
                var block = row[j];
                $row.append($('<td>'+ block + '</td>'));
            }
            $table.append($row);
        }

        $('.sudoku-wrapper').append($table);
    }

    $(function() {
        generate();
    });

})(jQuery);