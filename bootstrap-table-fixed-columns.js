/**
 * @author zhixin wen <wenzhixin2010@gmail.com>
 * @version: v1.0.1
 */

(function ($) {
    'use strict';

    $.extend($.fn.bootstrapTable.defaults, {
        fixedColumns: true,
        fixedLeftNumber: 0,
        fixedRightNumber:0
    });

    var BootstrapTable = $.fn.bootstrapTable.Constructor,
        _initHeader = BootstrapTable.prototype.initHeader,
        _initBody = BootstrapTable.prototype.initBody,
        _resetView = BootstrapTable.prototype.resetView;

    BootstrapTable.prototype.initFixedColumns = function () {
        this.$fixedHeader = $([
            '<div class="fixed-table-header-container  ">',
            '<div class="fixed-table-header-columns-left" id="header-left">',
            '<table>',
            '<thead></thead>',
            '</table>',
            '</div>',
            '<div class="fixed-table-header-columns-right" id="header-right">',
            '<table>',
            '<thead></thead>',
            '</table>',
            '</div>',
            '</div>'
        ].join(''));

        this.$fixedLeftHeader =this.$fixedHeader.find('#header-left');

        this.$fixedRightHeader =this.$fixedHeader.find('#header-right');

        this.timeoutHeaderColumns_ = 0;
        this.$fixedLeftHeader.find('table').attr('class', this.$el.attr('class'));
        this.$fixedRightHeader.find('table').attr('class', this.$el.attr('class'));

        this.$fixedHeaderLeftColumns = this.$fixedLeftHeader.find('thead');
        this.$fixedHeaderRightColumns=this.$fixedRightHeader.find('thead');

        this.$tableHeader.before(this.$fixedHeader);

        this.$fixedBody=$([
            '<div class="fixed-table-body-container  ">',
            '<div class="fixed-table-body-columns-left" id="body-left">',
            '<table>',
            '<tbody></tbody>',
            '</table>',
            '</div>',
            '<div class="fixed-table-body-columns-right" id="body-right">',
            '<table>',
            '<tbody></tbody>',
            '</table>',
            '</div>',
            '</div>'
        ].join(''));

        this.$fixedLeftBody = this.$fixedBody.find('#body-left');
        this.$fixedRightBody = this.$fixedBody.find('#body-right');

        this.timeoutBodyColumns_ = 0;
        this.$fixedLeftBody.find('table').attr('class', this.$el.attr('class'));
        this.$fixedBodyLeftColumns = this.$fixedLeftBody.find('tbody');

        this.$fixedRightBody.find('table').attr('class', this.$el.attr('class'));
        this.$fixedBodyRightColumns = this.$fixedRightBody.find('tbody');

        this.$tableBody.before(this.$fixedBody);
    };

    BootstrapTable.prototype.initHeader = function () {
        _initHeader.apply(this, Array.prototype.slice.apply(arguments));

        if (!this.options.fixedColumns) {
            return;
        }

        this.initFixedColumns();

        var that = this, $trsLeft = this.$header.find('tr').clone(),$trsRight=$trsLeft.clone();
        $trsLeft.each(function () {
            $(this).find('th:gt(' + that.options.fixedLeftNumber + ')').remove();
        });

        var rth=$trsRight.find('th').length-that.options.fixedRightNumber;
        $trsRight.each(function () {
            $(this).find('th:lt(' + rth + ')').remove();
        });


        this.$fixedHeaderLeftColumns.html('').append($trsLeft);
        this.$fixedHeaderRightColumns.html('').append($trsRight);
    };

    BootstrapTable.prototype.initBody = function () {
        _initBody.apply(this, Array.prototype.slice.apply(arguments));

        if (!this.options.fixedColumns) {
            return;
        }

        var that = this,
            rowspan = 0;

        this.$fixedBodyLeftColumns.html('');
        this.$fixedBodyRightColumns.html('');

        var $bodyTrElements= this.$body.find('> tr[data-index]');

        $bodyTrElements.each(function () {
            var $tr = $(this).clone(),
                $tds = $tr.find('td');

            $tr.html('');
            var end = that.options.fixedLeftNumber;
            if (rowspan > 0) {
                --end;
                --rowspan;
            }
            for (var i = 0; i < end; i++) {
                $tr.append($tds.eq(i).clone());
            }
            that.$fixedBodyLeftColumns.append($tr);

            if ($tds.eq(0).attr('rowspan')){
                rowspan = $tds.eq(0).attr('rowspan') - 1;
            }
        });
        rowspan = 0;
        $bodyTrElements.each(function () {
            var $tr = $(this).clone(),
                $tds = $tr.find('td');

            $tr.html('');
            var end = $tds.length;
            if (rowspan > 0) {
                --end;
                --rowspan;
            }
            for (var i = end-that.options.fixedRightNumber; i < end; i++) {
                $tr.append($tds.eq(i).clone());
            }
            that.$fixedBodyRightColumns.append($tr);

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
            leftHeaderWidth = 0,
            rightHeaderWidth = 0,
        trLength=0;


        this.$body.find('tr:first-child:not(.no-records-found) > *').each(function (i) {
            var $this = $(this),
                index = i;

            if (i >= that.options.fixedLeftNumber) {
                return false;
            }

            if (that.options.detailView && !that.options.cardView) {
                index = i - 1;
            }

            that.$fixedLeftHeader.find('th[data-field="' + visibleFields[index] + '"]')
                .find('.fht-cell').width($this.innerWidth());

            leftHeaderWidth += $this.outerWidth();
        });
        this.$fixedLeftHeader.width(leftHeaderWidth + 1).show();
        trLength=this.$body.find('tr:first-child:not(.no-records-found) > *').length;
        this.$body.find('tr:first-child:not(.no-records-found) > *').each(function (i) {
            var $this = $(this),
                index = i;

            if (i >= trLength-that.options.fixedRightNumber) {
                if (that.options.detailView && !that.options.cardView) {
                    index = i - 1;
                }

                that.$fixedRightHeader.find('th[data-field="' + visibleFields[index] + '"]')
                    .find('.fht-cell').width($this.innerWidth());

                rightHeaderWidth += $this.outerWidth();
            }


        });
        this.$fixedRightHeader.width(rightHeaderWidth + 1).show();
    };

    BootstrapTable.prototype.fitBodyColumns = function () {
        var that = this,
            top = -(parseInt(this.$el.css('margin-top')) - 2),
            // the fixed height should reduce the scorll-x height
            height = this.$tableBody.height() ;

        if (!this.$body.find('> tr[data-index]').length) {
            this.$fixedLeftBody.hide();
            this.$fixedRightBody.hide();
            return;
        }

        if (!this.options.height) {
            top = this.$fixedLeftHeader.height();
            height = height - top;
        }

        this.$fixedLeftBody.css({
            width: this.$fixedLeftHeader.width(),
            height: height,
            top: top
        }).show();

        this.$fixedRightBody.css({
            width: this.$fixedRightHeader.width(),
            height: height,
            top: top
        }).show();

        this.$body.find('> tr').each(function (i) {
            that.$fixedBody.find('tr:eq(' + i + ')').height($(this).height() - 1);
        });

        this.$fixedLeftHeader.find('th').each(function(i){
            that.$fixedLeftBody.find('td:eq(' + i + ')').width($(this).width()-2);
        });
        that.$fixedLeftBody.find('td:last-child').width('auto');

        this.$fixedRightHeader.find('th').each(function(i){
            that.$fixedRightBody.find('td:eq(' + i + ')').width($(this).width()-2);
        });
        that.$fixedRightBody.find('td:last-child').width('auto');


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
    };

})(jQuery);
