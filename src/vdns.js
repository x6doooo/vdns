
(function(window, $, _, undefined) {

    function toSideEnd(data, x, whichSide, changeMap, xHandler) {
        var tem;
        var cur;
        var sides;
        var temIdxs = [0];
        while(x >= 0 && x < data.length) {
            changeMap[x] = {};
            tem = [];
            sides = [];
            $.each(temIdxs, function(k, v) {
                cur = data[x][v];
                sides = sides.concat(cur[whichSide]);
                tem.push(cur);
                changeMap[x][v] = tem.length - 1;
            });
            data[x] = tem;
            temIdxs = _.uniq(sides);
            x = xHandler(x);
        }
    }

    function getCurrentData(data, x, old) {
        var changeMap = [];
        toSideEnd(data, x, 'right', changeMap, function(x) {
            return x + 1;
        });
        toSideEnd(data, x, 'left', changeMap, function(x) {
            return x - 1;
        });
        changeMap[x][old] = 0;
        var tem;
        var cur;
        $.each(data, function(k, v) {
            $.each(v, function(i, d) {
                tem = [];
                if (d.left) {
                    $.each(d.left, function(n, lft) {
                        cur = changeMap[k - 1][lft];
                        if (typeof cur === 'nubmer') {
                            tem.push(cur);
                        }
                    });
                    d.left = tem;
                }
                tem = [];
                if (d.right) {
                    $.each(d.right, function(n, rgt) {
                        cur = changeMap[k + 1][rgt];
                        if (k === 0) {
                            console.log(changeMap[k + 1]);
                        }
                        if (typeof cur === 'number') {
                            tem.push(cur);
                        }
                    });
                    d.right = tem;
                }
            });
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
                color: '#fff',
                duration: 500,
                circleRadiu: 3,
                rectStrokeWidth: 1,
                clientStroke: '#08c',
                resultStroke: '#690',
                rectWidth: 60,
                rectHeight: 20,
                boxPadding: 80,
                lineHeight: 30
            }, cfg, true);
        },
        load: function(data) {
            this.__sourceData__ = data;
            var max = d3.max(data, function(x) {
                return x.length;
            });
            var cfg = this.__config__;
            this.svg.attr('height', (max - 1) * cfg.lineHeight + cfg.boxPadding * 2);
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
            var __getX = d3.scale.linear()
                .domain([0, srcData.length - 1])
                .range([boxPadding, w - boxPadding]);

            var getX = function(p) {
                var q = __getX(p);
                if (p < 3) {
                    return q - 20 * p;
                }
                return q + 20 * (5 - p);
            };

            var getY = function(p) {
                return p * lineHeight + boxPadding;
            };

            svg.selectAll('path').remove();
            //svg.selectAll('g').remove();
            var isReload = svg.selectAll('g')[0].length;

            $.each(srcData, function(idx, v) {
                $.each(v, function(i, d) {
                    if (!d.right) return;
                    $.each(d.right, function(n, rIdx) {
                        var p0x = getX(idx) + cfg.rectWidth / 2;
                        var p0y = getY(i);
                        var p4x = getX(idx + 1) - cfg.rectWidth / 2;
                        var p4y = getY(rIdx);
                        var p2x = (p4x - p0x) / 2 + p0x;
                        var p2y = (p4y - p0y) / 2 + p0y;
                        var p1x = (p4x - p0x) / 4 + p0x;
                        // var p1y = p0y;

                        var inY = getY(0);
                        var desc =
                            'M' + p0x + ',' + p0y + ' ' +
                            'Q' + p1x + ',' + p0y + ' ' + p2x + ',' + p2y + ' ' +
                            'T' + p4x + ',' + p4y;

                        var initDesc =
                            'M' + p0x + ',' + inY + ' ' +
                            'Q' + p1x + ',' + inY + ' ' + p2x + ',' + inY + ' ' +
                            'T' + p4x + ',' + inY;

                        svg.append('path')
                            .attr({
                                d: initDesc,
                                fill: 'none',
                                stroke: '#333',
                                'stroke-width': 0.5
                            })
                            .transition()
                            .duration(cfg.duration)
                            .attr('d', desc);
                    });
                });

                var rects;
                var texts;
                var g;
                if (isReload) {
                    g = svg.select('g:nth-of-type(' + (idx + 1) + ')');
                    rects = g.selectAll('rect');
                    texts = g.selectAll('text');
                } else {
                    g = svg.append('g');
                    rects = g.selectAll('rect');
                    texts = g.selectAll('text');
                }

                rects = rects.data(v);
                rects.enter()
                    .append('rect')
                    .style('cursor', 'pointer')
                    .attr({
                        rx: 5,
                        ry: 5,
                        fill: function() {
                            return idx > 2 ? cfg.resultStroke : cfg.clientStroke;
                        },
                        stroke: function() {
                            return idx > 2 ? cfg.resultStroke : cfg.clientStroke;
                        },
                        width: cfg.rectWidth,
                        height: cfg.rectHeight,
                        'stroke-width': cfg.rectStrokeWidth,
                        x: function(d, i) {
                            return getX(idx) - cfg.rectWidth / 2;
                        },
                        y: function() {
                            return getY(0) - cfg.rectHeight / 2;
                        }
                    })
                    .transition()
                    .duration(cfg.duration)
                    .attr({
                        y: function(d, i) {
                            $(this).attr({
                                'data-pi': idx,
                                'data-i': i
                            });
                            return getY(i) - cfg.rectHeight / 2;
                        }
                    });


                /*
                circles.transition()
                    .duration(cfg.duration)
                    .attr('cy', function(d, i) {
                        $(this).attr({
                            'data-pi': idx,
                            'data-i': i
                        });
                        return getY(i);
                    });

                circles.enter()
                    .append('circle')
                    .style('cursor', 'pointer')
                    .attr({
                        r: cfg.circleRadiu,
                        fill: '#fff',
                        stroke: '#08c',
                        'stroke-width': cfg.circleStroke,
                        cx: function(d, i) {
                            return getX(idx)
                        },
                        cy: function(d, i) {
                            return getY(0);
                        }
                    })
                    .transition()
                    .duration(cfg.duration)
                    .attr({
                        cy: function(d, i) {
                            $(this).attr({
                                'data-pi': idx,
                                'data-i': i
                            });
                            return getY(i);
                        }
                    });
                    */

                    /*
                    .attr({
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
                    });*/

                /*
                circles.exit()
                    .transition()
                    .duration(cfg.duration)
                    .style('opacity', 0)
                    .remove();
                */

                texts.data(v)
                    .enter()
                    .append('text')
                    .style('cursor', 'pointer')
                    .text(function(d) {
                        return d.name;
                    })
                    .attr({
                        x: function(d, i) {
                            return getX(idx);
                        },
                        y: function(d, i) {
                            return getY(0);
                        },
                        fill: cfg.color,
                        'text-anchor': 'middle',
                        'alignment-baseline': 'middle',
                        'font-size': 12
                    })
                    .transition()
                    .duration(cfg.duration)
                    .attr({
                        y: function(d, i) {
                            return getY(i);
                        }
                    });


            });


            function eventHandler() {
                var pi = $(this).attr('data-pi');
                var i = $(this).attr('data-i');
                var data = $.extend([], self.__sourceData__, true);
                data[pi] = [data[pi][i]];
                data = getCurrentData(data, pi * 1, i);
                self.load(data);
            }

            svg.selectAll('circle').on('click', eventHandler);
            svg.selectAll('text').on('click', eventHandler);

        }
    };

    VDNS.prototype.init.prototype = VDNS.prototype;

    window.VDNS = VDNS;

})(window, jQuery, _);



