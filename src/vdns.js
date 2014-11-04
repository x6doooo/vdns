/**
 *  VDNS
 */

(function(window, undefined) {

    // util
    function uniqArray(arr) {
        var tem = {};
        var len = arr.length;
        while(len--) {
            tem[arr[len]] = true;
        }
        var a = [];
        for(len in tem) {
            a.push(len);
        }
        return a;
    }

    function toSideEnd(data, x, whichSide, xHandler) {
        var anotherSide = {
            right: 'left',
            left: 'right'
        }[whichSide];
        var tem;
        var cur;
        var sides;
        var temIdxs = [0];
        var currentChangeMap = {};
        var lastChangeMap;
        // todo: 每一列的修改纪录都记下来 最后再重置一遍
        while(x >= 0 && x < data.length) {
            lastChangeMap = currentChangeMap;
            currentChangeMap = {};
            tem = [];
            sides = [];
            $.each(temIdxs, function(k, v) {
                cur = data[x][v];
                if (cur && cur[whichSide]) {
                    sides = sides.concat(cur[whichSide]);
                }
                if (cur && cur[anotherSide]) {
                    $.each(cur[anotherSide], function(k2, v2) {
                        cur[anotherSide][k2] = lastChangeMap[v2];
                    });
                }
                tem.push(cur);
                currentChangeMap[v] = tem.length - 1;
            });
            data[x] = tem;
            temIdxs = uniqArray(sides);
            x = xHandler(x);

        }
    }

    function getCurrentData(data, x) {
        toSideEnd(data, x, 'right', function(x) {
            return x + 1;
        });
        toSideEnd(data, x, 'left', function(x) {
            return x - 1;
        });
        return data;
    }

    function VDNS(selector, width, height) {
        return new VDNS.prototype.init(selector, width, height);
    }

    VDNS.prototype = {
        constructor: VDNS,
        init: function(selector, width, height) {
            var self = this;
            if (!selector) {
                return self;
            }
            self.__containerSelector__ = selector;
            self.__container__ = d3.select(selector);
            self.svg = self.__container__.append('svg');
            self.svg.attr({
                width: width || 800,
                height: height || 600
            });
            self.config();
        },
        config: function(cfg) {
            cfg = cfg || {};
            this.__config__ = $.extend({
                boxPadding: 20,
                lineHeight: 90
            }, cfg, true);
        },
        load: function(data) {
            this.__sourceData__ = data;
            this.render();
        },
        render: function() {
            var self = this;

            var cfg = self.__config__;
            var srcData = $.extend([], self.__sourceData__, true);
            var svg = self.svg;
            var w = svg.attr('width');
            var h = svg.attr('height');

            var boxPadding = cfg.boxPadding;
            var lineHeight = cfg.lineHeight;
            var getX = d3.scale.linear()
                .domain([0, srcData.length - 1])
                .range([boxPadding, w - boxPadding]);

            var getY = function(p) {
                return p * lineHeight + boxPadding;
            };

            svg.selectAll('path').remove();
            svg.selectAll('g').remove();

            var gs;
            if (svg.selectAll('g')[0].length) {
                gs = svg.selectAll('g')[0];
                //return;
            }
            $.each(srcData, function(idx, v) {
                $.each(v, function(i, d) {
                    if (!d.right) return;
                    $.each(d.right, function(n, rIdx) {
                        var p0x = getX(idx);
                        var p0y = getY(i);
                        var p4x = getX(idx + 1);
                        var p4y = getY(rIdx);
                        var p2x = (p4x - p0x) / 2 + p0x;
                        var p2y = (p4y - p0y) / 2 + p0y;
                        var p1x = (p4x - p0x) / 4 + p0x;
                        // var p1y = p0y;
                        var desc =
                            'M' + p0x + ',' + p0y + ' ' +
                            'Q' + p1x + ',' + p0y + ' ' + p2x + ',' + p2y + ' ' +
                            'T' + p4x + ',' + p4y;

                        svg.append('path')
                            .attr({
                                d: 'M' + p0x + ',' + p0y + ' L' + p0x + ',' + p0y,
                                fill: 'none',
                                stroke: '#333',
                                'stroke-width': 0.5
                            })
                            .attr('d', desc);
                    });
                });

                var circles;
                if (gs) {
                    circles = gs[idx].select('circle').data(v).enter().append('circle');
                } else {
                    circles = svg.append('g')
                        .selectAll('circle')
                        .data(v)
                        .enter()
                        .append('circle')
                }
                circles.attr({
                    r: 5,
                    fill: '#fff',
                    stroke: '#08c',
                    'stroke-width': 2,
                    cx: function(d, i) {
                        return getX(idx);
                    },
                    cy: function(d, i) {
                        $(this).attr({
                            'data-pi': idx,
                            'data-i': i
                        });
                        return getY(i);
                    }
                });

            });

            svg.selectAll('circle').on('click', function() {
                var pi = $(this).attr('data-pi');
                var i = $(this).attr('data-i');
                var data = $.extend([], self.__sourceData__, true);
                data[pi] = [data[pi][i]];
                data = getCurrentData(data, pi * 1);
                console.log(data);
                self.load(data);
            });

        }
    };

    VDNS.prototype.init.prototype = VDNS.prototype;

    window.VDNS = VDNS;

})(window);



