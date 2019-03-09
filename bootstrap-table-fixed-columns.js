/**
 * @author zhixin wen <wenzhixin2010@gmail.com>
 * @version: v1.0.1
 * Modificated 16.08.16 by Aleksej Tokarev (Loecha)
 *  - Sorting Problem solved
 *  - Recalculated Size of fixed Columns
 */

(function ($) {
    'use strict';

    $.extend($.fn.bootstrapTable.defaults, {
        fixedColumns: false,
        fixedNumber: 1
    });

    var BootstrapTable  = $.fn.bootstrapTable.Constructor,
        _initHeader     = BootstrapTable.prototype.initHeader,
        _initBody       = BootstrapTable.prototype.initBody,
        _resetView      = BootstrapTable.prototype.resetView,
        _getCaret       = BootstrapTable.prototype.getCaret;  // Add: Aleksej

    BootstrapTable.prototype.initFixedColumns = function () {
        this.$fixedHeader = $([
            '<div class="fixed-table-header-columns">',
            '<table>',
            '<thead></thead>',
            '</table>',
            '</div>'].join(''));

        this.timeoutHeaderColumns_ = 0;
        this.$fixedHeader.find('table').attr('class', this.$el.attr('class'));
        this.$fixedHeaderColumns = this.$fixedHeader.find('thead');
        this.$tableHeader.before(this.$fixedHeader);

        this.$fixedBody = $([
            '<div class="fixed-table-body-columns">',
            '<table>',
            '<tbody></tbody>',
            '</table>',
            '</div>'].join(''));

        this.timeoutBodyColumns_ = 0;
        this.$fixedBody.find('table').attr('class', this.$el.attr('class'));
        this.$fixedBodyColumns = this.$fixedBody.find('tbody');
        this.$tableBody.before(this.$fixedBody);
    };

    BootstrapTable.prototype.initHeader = function () {
        _initHeader.apply(this, Array.prototype.slice.apply(arguments));

        if (!this.options.fixedColumns) {
            return;
        }

        this.initFixedColumns();

        var that = this, $trs = this.$header.find('tr').clone(true); //Fix: Aleksej "clone()" mit "clone(true)" ersetzt
        $trs.each(function () {
            // This causes layout problems:
            //$(this).find('th:gt(' + (that.options.fixedNumber -1) + ')').remove(); // Fix: Aleksej "-1" hinnzugefügt. Denn immer eine Spalte Mehr geblieben ist
            $(this).find('th:gt(' + that.options.fixedNumber + ')').remove();
        });
        this.$fixedHeaderColumns.html('').append($trs); 
    };

    BootstrapTable.prototype.initBody = function () {
        _initBody.apply(this, Array.prototype.slice.apply(arguments));

        if (!this.options.fixedColumns) {
            return;
        }

        var that = this,
            rowspan = 0;

        this.$fixedBodyColumns.html('');
        this.$body.find('> tr[data-index]').each(function () {
            var $tr = $(this).clone(),
                $tds = $tr.find('td');

            var dataIndex = $tr.attr("data-index");
            $tr = $("<tr></tr>");
            $tr.attr("data-index", dataIndex);

            var end = that.options.fixedNumber;
            if (rowspan > 0) {
                --end;
                --rowspan;
            }
            for (var i = 0; i < end; i++) {
                $tr.append($tds.eq(i).clone());
            }
            that.$fixedBodyColumns.append($tr);
            
            if ($tds.eq(0).attr('rowspan')){
                rowspan = $tds.eq(0).attr('rowspan') - 1;
            }
        });
    };

    BootstrapTable.prototype.resetView = function () {
        _resetView.apply(this, Array.prototype.slice.apply(arguments));

        if (!this.options.fixedColumns) {
            return;
        }

        clearTimeout(this.timeoutHeaderColumns_);
        this.timeoutHeaderColumns_ = setTimeout($.proxy(this.fitHeaderColumns, this), this.$el.is(':hidden') ? 100 : 0);

        clearTimeout(this.timeoutBodyColumns_);
        this.timeoutBodyColumns_ = setTimeout($.proxy(this.fitBodyColumns, this), this.$el.is(':hidden') ? 100 : 0);
    };

    BootstrapTable.prototype.fitHeaderColumns = function () {
        var that = this,
            visibleFields = this.getVisibleFields(),
            headerWidth = 0;

        this.$body.find('tr:first-child:not(.no-records-found) > *').each(function (i) {
            var $this = $(this),
                index = i;

            if (i >= that.options.fixedNumber) {
                return false;
            }

            if (that.options.detailView && !that.options.cardView) {
                index = i - 1;
            }

            var $th = that.$fixedHeader.find('th[data-field="' + visibleFields[index] + '"]');
            $th.find('.fht-cell').width($this.innerWidth());
            headerWidth += $this.outerWidth();

            $th.data('fix-pos', index);
        });
        this.$fixedHeader.width(headerWidth + 1).show();

        // fix click event
        this.$fixedHeader.delegate("tr th", 'click', function() {
            $(this).parents(".fixed-table-container").find(".fixed-table-body table thead tr th:eq("+$(this).data("fix-pos")+") .sortable").click();
        })
    };

    /**
    * Add: Aleksej
    * Hook für getCaret. Aktualisieren Header bei Fixed-Columns wenn diese sortiert wurden
    * @method getCaret
    * @for BootstrapTable
    */
    BootstrapTable.prototype.getCaret = function () {
        var result = _getCaret.apply(this, arguments);

        if (this.options.fixedColumns && this.$fixedHeaderColumns instanceof jQuery) {
            var that = this, $th;

            $.each(this.$fixedHeaderColumns.find('th'), function (i, th) {
                $th = $(th);
                $th.find('.sortable').removeClass('desc asc').addClass($th.data('field') === that.options.sortName ? that.options.sortOrder : 'both');
            });
        }

     return result;
    };

    /**
     * Add: Aleksej, zum berechnen von Scrollbar-Größe
     * @method calcScrollBarSize
     * @return Number
     */
    BootstrapTable.prototype.calcScrollBarSize = function () {
        // Es ist egal, ob Höhe oder Breite
        var tmpWidth        = 100,
            $container      = $('<div>').css({
                width       : tmpWidth, 
                overflow    : 'scroll', 
                visibility  : 'hidden'}
            ).appendTo('body'),
            widthWithScroll = $('<div>').css({
                width: '100%'
            }).appendTo($container).outerWidth();

        $container.remove();
        return tmpWidth - widthWithScroll;
    };

    BootstrapTable.prototype.fitBodyColumns = function () {
        var that            = this,
            borderHeight    = (parseInt(this.$el.css('border-bottom-width')) + parseInt(this.$el.css('border-top-width'))), // Add. Aleksej
            top             = this.$fixedHeader.outerHeight() + borderHeight, // Fix. Aleksej "-2" mit "+ borderHeight" ersetzt
            // the fixed height should reduce the scorll-x height
            height          = this.$tableBody.height() - this.calcScrollBarSize(); // Fix. Aleksej "-14" mit "- this.calcScrollBarSize()" ersetzt
            
        if (!this.$body.find('> tr[data-index]').length) {
            this.$fixedBody.hide();
            return;
        }

        if (!this.options.height) {
            top = this.$fixedHeader.height();
            height = height - top;
        }

        this.$fixedBody.css({
            width: this.$fixedHeader.width(),
            height: height,
            top: top
        }).show();

        this.$body.find('> tr').each(function (i) {
            that.$fixedBody.find('tr:eq(' + i + ')').height($(this).height() - 1);
        });

        // events
        this.$tableBody.on('scroll', function () {
            that.$fixedBody.find('table').css('top', -$(this).scrollTop());
        });
        this.$body.find('> tr[data-index]').off('hover').hover(function () {
            var index = $(this).data('index');
            that.$fixedBody.find('tr[data-index="' + index + '"]').addClass('hover');
        }, function () {
            var index = $(this).data('index');
            that.$fixedBody.find('tr[data-index="' + index + '"]').removeClass('hover');
        });
        this.$fixedBody.find('tr[data-index]').off('hover').hover(function () {
            var index = $(this).data('index');
            that.$body.find('tr[data-index="' + index + '"]').addClass('hover');
        }, function () {
            var index = $(this).data('index');
            that.$body.find('> tr[data-index="' + index + '"]').removeClass('hover');
        });

        // fix td width bug
        var $first_tr = that.$body.find('tr:eq(0)');
        that.$fixedBody.find('tr:eq(0)').find("td").each(function(index) {
            $(this).width($first_tr.find("td:eq("+index+")").width())
        });
    };

})(jQuery);
