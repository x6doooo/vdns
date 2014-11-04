/**
 *  VDNS
 */

(function() {

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
        },
        load: function(data) {
            this.__sourceData__ = data;
        },
        render: function() {
            var self = this;

            var srcData = $.extend([], self.__sourceData__, true);
            var svg = self.svg;
            var w = svg.attr('width');
            var h = svg.attr('height');

            var padding = 20;
            var getX = d3.scale.linear()
                .domain([0, srcData.length - 1])
                .range([padding, w - padding]);

            var getY = function(p) {
                return p * 90 + padding;
            };

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
                svg.append('g')
                    .selectAll('circle')
                    .data(v)
                    .enter()
                    .append('circle')
                    .attr({
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

            function toRight(data, x, y) {
                var target = [];
                var c = data[x][y];

                if (!c.right) return;
                x += 1;
                var temIdxs = c.right;
                var tem;
                var cur;
                var rights;
                do {
                    tem = [];
                    rights = [];
                    $.each(temIdxs, function(k, v) {
                        cur = data[x][v];
                        if (cur.right) {
                            rights = rights.concat(cur.right);
                        }
                        tem.push(cur);
                    });
                    data[x - 1] = tem;
                    temIdxs = uniqArray(rights);
                    x += 1;
                } while(x >= 0 && x < data.length);
                data = target;
            }

            svg.selectAll('circle').on('click', function() {
                var pi = $(this).attr('data-pi');
                var i = $(this).attr('data-i');
                var data = $.extend([], self.sourceData, true);
                data[pi] = [data[pi][i]];
                toRight(data, pi, i);
                console.log(data);
            });

        }
    };

    VDNS.prototype.init.prototype = VDNS.prototype;

})();



