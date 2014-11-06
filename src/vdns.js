
(function(window, $, _, undefined) {

    function toSideEnd(data, x, old, whichSide, changeMap, xHandler) {
        var tem;
        var cur;
        var sides;
        var temIdxs = [old];
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
            temIdxs = _.uniq(sides);
            temIdxs.sort(function(a, b) {
                return a - b;
            });
            x = xHandler(x);
        }
    }

    function getCurrentData(data, x, old) {
        var changeMap = [];
        toSideEnd(data, x, old, 'right', changeMap, function(x) {
            return x + 1;
        });
        toSideEnd(data, x, old, 'left', changeMap, function(x) {
            return x - 1;
        });
        changeMap[x][old] = 0;
        return changeMap;
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
                ease: 'bounce',
                circleRadiu: 3,
                rectStrokeWidth: 1,
                clientStroke: '#08c',
                resultStroke: '#690',
                rectWidth: 60,
                rectHeight: 14,
                boxPadding: 40,
                lineHeight: 20
            }, cfg, true);
        },
        _formatIndex: function(changeMap) {
            var self = this;
            var srcData = self.__sourceData__;

            var formated = [
                [], [], [],
                [], [], []
            ];
            var map = {
                2: {
                    next: 1,
                    final: 0,
                    side: 'left'
                },
                3: {
                    next: 4,
                    final: 5,
                    side: 'right'
                }
            };
            var next;
            var final;
            var side;
            var cur;
            var mapCur;
            var count;
            function formatFunc(num, k, isp) {
                isp.__idx__ = k;
                mapCur = map[num];
                next = mapCur.next;
                final = mapCur.final;
                side = mapCur.side;
                if (!formated[next][isp[side][0]]) {
                    formated[next][isp[side][0]] = true;
                    cur = srcData[next][isp[side][0]];
                    cur.__idx__ = k;
                    if (!formated[final][cur[side][0]]) {
                        formated[final][cur[side][0]] = true;
                        srcData[final][cur[side][0]].__idx__ = k;
                    }
                }
            }
            $.each([2, 3], function(i, num) {
                if (changeMap) {
                    count = 0;
                    $.each(changeMap[num], function(ispIdx, k) {
                        formatFunc(num, count++, srcData[num][ispIdx]);
                    });
                } else {
                    $.each(srcData[num], function(k, isp) {
                        formatFunc(num, k, isp);
                    });
                }
            });
        },
        resizeSvg: function(max) {
            this.svg.transition()
                .duration(this.__config__.duration)
                .attr('height', (max - 1) * this.__config__.lineHeight + this.__config__.boxPadding * 2);
        },
        load: function(data) {
            this.__sourceData__ = data;
            var max = d3.max(data, function(x) {
                return x.length;
            });
            var cfg = this.__config__;
            this.resizeSvg(max);

            var __getX = d3.scale.linear()
                .domain([0, data.length - 1])
                .range([cfg.boxPadding, this.svg.attr('width') - cfg.boxPadding]);

            this._formatIndex();

            this.getX = function(p) {
                var q = __getX(p);
                if (p < 3) {
                    return q - 20 * p;
                }
                return q + 20 * (5 - p);
            };

            this.getY = function(p, idx) {
                return data[idx][p].__idx__ * cfg.lineHeight + cfg.boxPadding;
            };
            this.render();
        },
        render: function() {
            var self = this;

            var cfg = self.__config__;
            var srcData = $.extend([], self.__sourceData__, true);
            var svg = self.svg;
            var getX = self.getX;
            var getY = self.getY;

            $.each(srcData, function(idx, v) {
                var g = svg.append('g');
                $.each(v, function(i, d) {
                    if (!d.right) return;
                    $.each(d.right, function(n, rIdx) {

                        var p0x = getX(idx) + cfg.rectWidth / 2;
                        var p0y = getY(i, idx);
                        var p4x = getX(idx + 1) - cfg.rectWidth / 2;
                        var p4y = getY(rIdx, idx + 1);
                        var p2x = (p4x - p0x) / 2 + p0x;
                        var p2y = (p4y - p0y) / 2 + p0y;
                        var p1x = (p4x - p0x) / 4 + p0x;
                        // var p1y = p0y;

                        var inY = getY(0, idx);
                        var desc =
                            'M' + p0x + ',' + p0y + ' ' +
                            'Q' + p1x + ',' + p0y + ' ' + p2x + ',' + p2y + ' ' +
                            'T' + p4x + ',' + p4y;

                        var initDesc =
                            'M' + p0x + ',' + inY + ' ' +
                            'Q' + p1x + ',' + inY + ' ' + p2x + ',' + inY + ' ' +
                            'T' + p4x + ',' + inY;

                        g.append('path')
                            .attr({
                                'data-from-idx': idx,
                                'data-from-i': i,
                                'data-to-i': rIdx,
                                d: initDesc,
                                fill: 'none',
                                stroke: '#333',
                                'stroke-width': 0.5
                            })
                            .transition()
                            .duration(cfg.duration)
                            .ease(cfg.ease)
                            .attr('d', desc);
                    });
                });

                var rects = g.selectAll('rect');
                var texts = g.selectAll('text');

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
                        y: function(d, i) {
                            $(this).attr({
                                'data-pi': idx,
                                'data-i': i
                            });
                            return getY(0, idx) - cfg.rectHeight / 2;
                        }
                    })
                    .transition()
                    .duration(cfg.duration)
                    .ease(cfg.ease)
                    .attr({
                        y: function(d, i) {
                            return getY(i, idx) - cfg.rectHeight / 2;
                        }
                    });

                texts.data(v)
                    .enter()
                    .append('text')
                    .style('cursor', 'pointer')
                    .text(function(d) {
                        return d.name;
                    })
                    .attr({
                        class: function(d, i) {
                            return 'text-' + idx + '-' + i;
                        },
                        x: function(d, i) {
                            return getX(idx);
                        },
                        y: function(d, i) {
                            $(this).attr({
                                'data-pi': idx,
                                'data-i': i
                            });
                            return getY(0, idx);
                        },
                        fill: cfg.color,
                        'text-anchor': 'middle',
                        'alignment-baseline': 'middle',
                        'font-size': 12
                    })
                    .transition()
                    .duration(cfg.duration)
                    .ease(cfg.ease)
                    .attr({
                        y: function(d, i) {
                            return getY(i, idx);
                        }
                    });


            });

            function eventHandler() {
                var pi = $(this).attr('data-pi');
                var i = $(this).attr('data-i');
                var data = $.extend([], self.__sourceData__, true);
                //data[pi] = [data[pi][i]];
                var changeMap = getCurrentData(data, pi * 1, i);
                self.refresh(changeMap);
            }

            svg.selectAll('circle').on('click', eventHandler);
            svg.selectAll('text').on('click', eventHandler);
            $(svg[0][0]).on('click', function(e) {
                if (e.target.tagName !== 'svg') {
                    return;
                }
                var changeMap = [];
                $.each(srcData, function(k, v) {
                    changeMap[k] = [];
                    $.each(v, function(i, x) {
                        changeMap[k][i] = i;
                    });
                });
                self.refresh(changeMap);
                return false;
            });

        },
        refresh: function(changeMap) {
            var self = this;
            var cfg = self.__config__;
            var svg = self.svg;

            console.log(changeMap);
            var max = d3.max(changeMap, function(x) {
                return _.size(x);
            });
            this.resizeSvg(max);

            this._formatIndex(changeMap);

            var getX = self.getX;
            var getY = self.getY;

            svg.selectAll('g').selectAll('rect')
                .transition()
                .duration(cfg.duration)
                .ease(cfg.ease)
                .attr({
                    opacity: function(d, i, idx) {
                        if (changeMap[idx][i] === undefined) {
                            return 0;
                        }
                        return 1;
                    },
                    y: function(d, i, idx) {
                        return getY(i, idx) - cfg.rectHeight / 2;
                    }
                });
            svg.selectAll('g').selectAll('text')
                .transition()
                .duration(cfg.duration)
                .ease(cfg.ease)
                .attr({
                    opacity: function(d, i, idx) {
                        if (changeMap[idx][i] === undefined) {
                            return 0;
                        }
                        return 1;
                    },
                    y: function(d, i, idx) {
                        return getY(i, idx);
                    }
                });
            svg.selectAll('g').selectAll('path')
                .transition()
                .duration(cfg.duration)
                .ease(cfg.ease)
                .attr({
                    opacity: function(d, i, idx) {
                        var from = $(this).attr('data-from-i');
                        var to = $(this).attr('data-to-i');
                        if (changeMap[idx][from] === undefined || changeMap[idx + 1][to] === undefined) {
                            return 0;
                        }
                        return 1;
                    },
                    d: function(d, i, idx) {
                        var from = $(this).attr('data-from-i');

                        var rIdx = $(this).attr('data-to-i');

                        var p0x = getX(idx) + cfg.rectWidth / 2;
                        var p0y = getY(from, idx);
                        var p4x = getX(idx + 1) - cfg.rectWidth / 2;
                        var p4y = getY(rIdx, idx + 1);
                        var p2x = (p4x - p0x) / 2 + p0x;
                        var p2y = (p4y - p0y) / 2 + p0y;
                        var p1x = (p4x - p0x) / 4 + p0x;

                        var desc =
                            'M' + p0x + ',' + p0y + ' ' +
                            'Q' + p1x + ',' + p0y + ' ' + p2x + ',' + p2y + ' ' +
                            'T' + p4x + ',' + p4y;
                        return desc;
                    }
                });
        }
    };

    VDNS.prototype.init.prototype = VDNS.prototype;

    window.VDNS = VDNS;

})(window, jQuery, _);



