(function(window, $, _, undefined) {

    function makeCurveDesc(p0, p1, p2, p4) {
        return 'M' + p0[0] + ',' + p0[1] + ' ' +
        'Q' + p1[0] + ',' + p1[1] + ' ' + p2[0] + ',' + p2[1] + ' ' +
        'T' + p4[0] + ',' + p4[1];
    }

    // 向指定方向查找关联点
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
            /**
             *  去重 and 排序
             *  todo: _.uniq(arr, true) 这个写法有问题
             */
            temIdxs = _.uniq(sides);
            temIdxs.sort(function(a, b) {
                return a - b;
            });
            x = xHandler(x);
        }
    }

    // 以一个点，获取与该点相关联的所有点
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

    // tooltip
    var tooltip = $('<div class="vdns-tooltip"></div>');

    // class
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
            // 选择器
            self.__containerSelector__ = selector;
            self.__container__ = d3.select(selector);
            self.svg = self.__container__.append('svg');
            self.svg.attr({
                width: width || 1000,
                height: height || 600
            });
            // 生成默认配置
            self.config();
        },
        // 生成配置
        config: function(cfg) {
            cfg = cfg || {};
            var lastCfg = this.__config__ || {
                color: '#fff',
                duration: 800,
                ease: 'bounce',
                circleRadiu: 3,
                rectStrokeWidth: 1,
                clientStroke: '#08c',
                resultStroke: '#690',
                rectWidth: 60,
                rectHeight: 14,
                boxPadding: 40,
                lineHeight: 20
            };
            this.__config__ = $.extend(lastCfg, cfg, true);
        },
        /**
         * 计算每个元素的y轴序数 __idx__
         * __idx__用于计算元素的位置
         */
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
        // 重新计算svg的高度
        resizeSvg: function(max) {
            this.svg.transition()
                .duration(this.__config__.duration)
                .attr('height', (max - 1) * this.__config__.lineHeight + this.__config__.boxPadding * 2);
        },
        // 加载数据
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

            // 获取x轴坐标的方法
            this.getX = function(p) {
                var q = __getX(p);
                if (p < 3) {
                    return q - 20 * p;
                }
                return q + 20 * (5 - p);
            };

            // 获取y轴坐标的方法
            this.getY = function(p, idx) {
                return data[idx][p].__idx__ * cfg.lineHeight + cfg.boxPadding;
            };
            this.render();
        },

        // 第一次渲染
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

                        var p0 = [
                            getX(idx) + cfg.rectWidth / 2,
                            getY(i, idx)
                        ];
                        var p4 = [
                            getX(idx + 1) - cfg.rectWidth / 2,
                            getY(rIdx, idx + 1)
                        ];
                        var p1 = [
                            (p4[0] - p0[0]) / 4 + p0[0],
                            p0[1]
                        ];
                        var p2 = [
                            (p4[0] - p0[0]) / 2 + p0[0],
                            (p4[1] - p0[1]) / 2 + p0[1]
                        ];

                        var inY = getY(0, idx);
                        var desc = makeCurveDesc(p0, p1, p2, p4);
                        var inP0 = [p0[0], inY];
                        var inP1 = [p1[0], inY];
                        var inP2 = [p2[0], inY];
                        var inP4 = [p4[0], inY];
                        var initDesc = makeCurveDesc(inP0, inP1, inP2, inP4);
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
                        'data-msg': function(d) {
                            if (d.clientIPs) {
                                var tem = [d.nodeName, '客户端IP：'];
                                $.each(d.clientIPs, function(ip, bool) {
                                    tem.push(ip);
                                });
                                return tem.join('<br>')
                            }
                            if (d.ips) {
                                var tem = [d.nodeName, '解析IP：'];
                                $.each(d.ips, function(ip, bool) {
                                    tem.push(ip);
                                });
                                return tem.join('<br>')
                            }
                            return d.fullname;
                        },
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
                        'data-msg': function(d) {
                            if (d.clientIPs) {
                                var tem = [d.nodeName, '客户端IP：'];
                                $.each(d.clientIPs, function(ip, bool) {
                                    tem.push(ip);
                                });
                                return tem.join('<br>')
                            }
                            if (d.ips) {
                                var tem = [d.nodeName, '解析IP：'];
                                $.each(d.ips, function(ip, bool) {
                                    tem.push(ip);
                                });
                                return tem.join('<br>')
                            }
                            return d.fullname;
                        },
                        'class': function(d, i) {
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
                        //dy: '.3em', // IE下垂直剧中
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

            returnAllData();

            // 事件处理
            // 这部分的处理比较复杂，涉及各种状态下hover和click的切换
            function eventHandler($el, isHover) {
                if ($el.attr('opacity') != 1) {
                    if (isHover) return;
                    returnAllData();
                    return;
                }

                // tooltip
                var p = $el.position();
                var offsetLeft = 50;
                if ($el.prop('tagName') == 'rect') {
                    offsetLeft = 68;
                }
                tooltip.appendTo(self.__containerSelector__)
                    .css({
                        top: p.top,
                        left: p.left + offsetLeft
                    })
                    .html($el.attr('data-msg'));

                var pi = $el.attr('data-pi') * 1;
                var i = $el.attr('data-i');
                var data = $.extend([], self.__sourceData__, true);
                if (isHover && !self.lastChangeMap) {
                    self.lastChangeMap = self.changeMap;
                }
                self.changeMap = getCurrentData(data, pi, i);
                if (!isHover) {
                    self.lastChangeMap = self.changeMap;
                }
                self.refresh(self.changeMap, isHover);
            }

            // 回到点击or hover前的状态
            function returnAllData(isHover) {
                tooltip.remove();
                if (isHover && self.lastChangeMap) {
                    self.refresh(self.lastChangeMap);
                    return;
                }
                if (!isHover) {
                    self.lastChangeMap = null;
                }
                var changeMap = [];
                $.each(srcData, function(k, v) {
                    changeMap[k] = [];
                    $.each(v, function(i, x) {
                        changeMap[k][i] = i;
                    });
                });
                self.changeMap = changeMap;
                self.refresh(changeMap);
            }

            svg.selectAll('rect').on('click', function() {
                eventHandler($(this));
            }).on('mouseover', function() {
                eventHandler($(this), true);
            }).on('mouseout', function() {
                returnAllData(true);
            });
            svg.selectAll('text').on('click', function() {
                eventHandler($(this));
            }).on('mouseover', function() {
                eventHandler($(this), true);
            }).on('mouseout', function() {
                returnAllData(true);
            });

            svg.selectAll('path').on('click', function() {
                returnAllData();
            });
            $(document).on('click', function(e) {
                if (e.target.tagName !== 'HTML') {
                    return;
                }
                returnAllData();
                return false;
            });
            $(svg[0][0]).on('click', function(e) {
                if (e.target.tagName !== 'svg') {
                    return;
                }
                returnAllData();
                return false;
            });

        },
        // 刷新
        refresh: function(changeMap, isHover) {
            var self = this;
            var cfg = self.__config__;
            var svg = self.svg;


            this._formatIndex(changeMap);

            var getX = self.getX;
            var getY = self.getY;

            var g = svg.selectAll('g');
            var rects = g.selectAll('rect');
            var texts = g.selectAll('text');
            var paths = g.selectAll('path');

            var opacity = 0;
            if (isHover) {
                opacity = 0.2;
            }

            rects.attr({
                opacity: function(d, i, idx) {
                    if (isHover && $(this).attr('opacity') == 0) {
                        if (changeMap[idx][i] === undefined) {
                            return 0;
                        }
                        return opacity;
                    }
                    if (changeMap[idx][i] === undefined) {
                        return opacity;
                    }
                    return 1;
                }
            })

            texts.attr({
                opacity: function(d, i, idx) {
                    if (isHover && $(this).attr('opacity') == 0) {
                        if (changeMap[idx][i] === undefined) {
                            return 0;
                        }
                        return opacity;
                    }
                    if (changeMap[idx][i] === undefined) {
                        return opacity;
                    }
                    return 1;
                }
            });

            paths.attr({
                opacity: function(d, i, idx) {
                    var from = $(this).attr('data-from-i');
                    var to = $(this).attr('data-to-i');
                    if (isHover && $(this).attr('opacity') == 0) {
                        if (changeMap[idx][from] === undefined || changeMap[idx + 1][to] === undefined) {
                            return 0;
                        }
                        return opacity;
                    }
                    if (changeMap[idx][from] === undefined || changeMap[idx + 1][to] === undefined) {
                        return 0;
                    }
                    return 1;
                }
            });

            if (isHover) {
                return;
            }
            var max = d3.max(changeMap, function(x) {
                return _.size(x);
            });
            this.resizeSvg(max);

            rects.transition()
                .duration(cfg.duration)
                .ease(cfg.ease)
                .attr({
                    y: function(d, i, idx) {
                        return getY(i, idx) - cfg.rectHeight / 2;
                    }
                });

            texts.transition()
                .duration(cfg.duration)
                .ease(cfg.ease)
                .attr({
                    y: function(d, i, idx) {
                        return getY(i, idx);
                    }
                });

            paths.transition()
                .duration(cfg.duration)
                .ease(cfg.ease)
                .attr({
                    d: function(d, i, idx) {
                        var from = $(this).attr('data-from-i');
                        var rIdx = $(this).attr('data-to-i');

                        var p0 = [
                            getX(idx) + cfg.rectWidth / 2,
                            getY(from, idx)
                        ];
                        var p4 = [
                            getX(idx + 1) - cfg.rectWidth / 2,
                            getY(rIdx, idx + 1)
                        ];
                        var p1 = [
                            (p4[0] - p0[0]) / 4 + p0[0],
                            p0[1]
                        ];
                        var p2 = [
                            (p4[0] - p0[0]) / 2 + p0[0],
                            (p4[1] - p0[1]) / 2 + p0[1]
                        ];

                        return makeCurveDesc(p0, p1, p2, p4);
                    }
                });
        }
    };

    VDNS.prototype.init.prototype = VDNS.prototype;

    window.VDNS = VDNS;

})(window, jQuery, _);



