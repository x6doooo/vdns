
var PI = Math.PI;
var sin = Math.sin;
var cos = Math.cos;

// 生成bezier曲线的字符串描述
function makeTbezierDesc(p0, p1, p2, p4) {
    return 'M' + p0.join(',') + ' ' +
        'Q' + p1.join(',') + ' ' + p2.join(',') + ' ' +
        'T' + p4.join(',');
}
function makeQbezierDesc(p0, p1, p2) {
    return 'M' + p0.join(',') + 'Q' + p1.join(',') + ' ' + p2.join(',');
}

VDNS.prototype = {
    constructor: VDNS,

    // 初始化
    init: function(selector, width, height) {
        var self = this;
        if (!selector) {
            return self;
        }
        // 选择器
        self.__selector__ = selector;
        self.__container__ = d3.select(selector);
        self.svg = self.__container__.append('svg');
        self.svg.attr({
            width: width || 1000,
            height: height || 700
        });
        self.config();
    },

    // 更新配置
    config: function(cfg) {
        cfg = cfg || {};
        var lastCfg = this.__config__ || {
            color: '#fff',
            duration: 800,
            ease: 'bounce',
            clientColor: '#08c',
            resultColor: '#690',
            rectWidth: 60,
            rectHeight: 14,
            rectRadius: 3,
            boxPadding: 40,
            lineHeight: 20
        };

        this.__config__ = _.assign(lastCfg, cfg);
    },

    // 载入数据
    load: function(data) {
        console.log(data);
        var self = this;
        var svg = self.svg;

        var cfg = self.__config__;

        var className = [
            'clientProvinceRect',
            'clientCityRect',
            'clientIspRect',
            'resultIspRect',
            'resultCityRect',
            'resultProvinceRect'
        ];
        self.__sourceDataBackup__ = data;
        var srcData = self.__sourceData__ = _.cloneDeep(data);

        // 计算图形的基本参数

        // 环上一个节点的半径
        var nodeRectRadius = cfg.rectRadius;
        var nodeRectDiameter = nodeRectRadius * 2;

        // 环上一共有多少点 （多加2个点，用于分隔client和result）
        var nodesCountOnRing = srcData[0].length + srcData[5].length + 2;

        // 一个节点所占的弧长
        var arcLengthOfRect = 28;

        // 环形的半径
        var ringRadius = nodesCountOnRing * arcLengthOfRect / PI / 2;

        if (ringRadius < 100) {
            ringRadius = 100;
            arcLengthOfRect = ringRadius * 2 * PI / nodesCountOnRing;
        }

        // 原点
        var zeroPointX = self.__config__.zeroPointX = self.svg.attr('width') / 2;
        var zeroPointY = self.__config__.zeroPointY = self.svg.attr('height') / 2;

        // 弧度转换函数
        var lengthOfResults = srcData[5].length;
        var getIdxOnRing = function(i, isResult) {
            if (isResult) {
                return i - lengthOfResults / 2;
            }
            return lengthOfResults / 2 + 1 + i;
        };

        // 计算弧度
        var getRad = window.getRad = d3.scale.linear()
            .domain([0, nodesCountOnRing])
            .range([0, 2 * PI]);

        // 获取坐标
        var getNodeX = function(rad) {
            return cos(rad) * ringRadius + zeroPointX;
        };
        var getNodeY = function(rad) {
            return sin(rad) * ringRadius + zeroPointY;
        };

        // 环形的坐标是固定的，so 将坐标缓存到数据里
        _.forEach(srcData[0], function(d, i) {
            // 顺序 反向
            d.rad = getRad(getIdxOnRing(srcData[0].length - i - 1));
            d.xOnRing = getNodeX(d.rad);
            d.yOnRing = getNodeY(d.rad);
        });
        _.forEach(srcData[5], function(d, i) {
            d.rad = getRad(getIdxOnRing(i, true));
            d.xOnRing = getNodeX(d.rad);
            d.yOnRing = getNodeY(d.rad);
        });

        // 生成g & rect & text & path
        var g;
        var background;

        // path
        g = svg.append('g')
            .style('display', 'none')
            .classed('pathInRing', true);
        g = svg.append('g')
            .style('display', 'none')
            .classed('pathInDetail', true);

        // rect & text
        g = svg.selectAll('g.shape')
            .data(self.__sourceData__)
            .enter()
            .append('g')
            .classed('shape', true)
            .style('display', 'none')
            .each(function(d, i) {
                g = d3.select(this);

                if (i < 3) {
                    background = cfg.clientColor;
                } else {
                    background = cfg.resultColor;
                }

                g.classed(className[i], true)
                    .selectAll('rect')
                    .data(d)
                    .enter()
                    .append('rect')
                    .style('cursor', 'pointer')
                    .attr({
                        'class': function(dd, ii) {
                            return className[i] + '-' + ii;
                        },
                        'data-idx': function(dd, ii) {
                            return ii;
                        },
                        fill: background,
                        width: nodeRectDiameter,
                        height: nodeRectDiameter,
                        rx: nodeRectDiameter,
                        ry: nodeRectDiameter,
                        x: zeroPointX,
                        y: zeroPointY
                    });

                g.selectAll('text')
                    .data(d)
                    .enter()
                    .append('text')
                    .style('cursor', 'pointer')
                    .text(function(item) {
                        return item.name;
                    })
                    .attr({
                        'class': function(dd, ii) {
                            return className[i] + 'Text-' + ii;
                        },
                        'data-idx': function(d, i) {
                            return i;
                        },
                        'text-anchor': 'middle',
                        'alignment-baseline': 'middle',
                        'font-size': 12,
                        fill: background,
                        x: zeroPointX,
                        y: zeroPointY
                    });

            });

    },

    // 绘制环形
    renderRing: function() {
        var self = this;
        var svg = self.svg;
        var cfg = self.__config__;
        var srcData = self.__sourceData__;
        var clientG = svg.select('.clientProvinceRect');
        var resultG = svg.select('.resultProvinceRect');
        var pathG = svg.select('g.pathInRing');
        // 原点
        var zeroPointX = cfg.zeroPointX;
        var zeroPointY = cfg.zeroPointY;

        var positionObj = {
            x: function(d) {
                return d.xOnRing +
                    cos(d.rad) * (d3.select(this).style('width').replace('px', '') * 1 + cfg.rectRadius + 8) / 2;
            },
            y: function(d) {
                return d.yOnRing +
                    sin(d.rad) * (d3.select(this).style('height').replace('px', '') * 1 + cfg.rectRadius + 8) / 2;
            }
        };

        var positionObjRect = {
            x: function(d) {
                return d.xOnRing - cfg.rectRadius;// - cos(d.rad) * cfg.rectRadius - d3.select(this).attr('width') / 2;
            },
            y: function(d) {
                return d.yOnRing - cfg.rectRadius;//- sin(d.rad) * cfg.rectRadius - d3.select(this).attr('height') / 2;
            }
        };

        var clientProvinces = srcData[0];
        _.forEach(clientProvinces, function(cpr, idx) {
            _.forEach(cpr.rightProvinces, function(rprIdx) {
                pathG.append('path')
                    .attr({
                        'class': function() {
                            return 'pathInRing-client-' + idx + ' pathInRing-result-' + rprIdx;
                        },
                        d: makeQbezierDesc(
                            [zeroPointX, zeroPointY],
                            [zeroPointX, zeroPointY],
                            [zeroPointX, zeroPointY]
                        ),
                        fill: 'none',
                        stroke: '#ddd',
                        'stroke-width': 1,
                        'data-from': idx,
                        'data-to': rprIdx
                    });
            });
        });

        clientG.style('display', '')
            .selectAll('rect')
            .transition()
            .ease(cfg.ease)
            .duration(cfg.duration)
            .attr(positionObjRect);

        resultG.style('display', '')
            .selectAll('rect')
            .transition()
            .ease(cfg.ease)
            .duration(cfg.duration)
            .attr(positionObjRect);

        clientG.selectAll('text')
            .transition()
            .ease(cfg.ease)
            .duration(cfg.duration)
            .attr(positionObj);

        resultG.selectAll('text')
            .transition()
            .ease(cfg.ease)
            .duration(cfg.duration)
            .attr(positionObj);

        // 解绑所有事件
        //svg.selectAll('path').style('display', 'none');
        svg.selectAll('rect').on('mouseover', null).on('mouseout', null).on('click', null);
        svg.selectAll('text').on('mouseover', null).on('mouseout', null).on('click', null);

        // 绑定当前状态的事件
        var opacity = 0.2;
        function mouseoutHandle() {
            resultG.selectAll('text').attr('opacity', 1);
            resultG.selectAll('rect').attr('opacity', 1);
            clientG.selectAll('text').attr('opacity', 1);
            clientG.selectAll('rect').attr('opacity', 1);
            pathG.selectAll('path').style('display', '');
        }
        function mouseoverHandle(el, srcDataIdx, tG, tN, fG, fN, forward) {
            var i = el.attr('data-idx');
            var d = srcData[srcDataIdx][i];
            resultG.selectAll('text').attr('opacity', opacity);
            resultG.selectAll('rect').attr('opacity', opacity);
            clientG.selectAll('text').attr('opacity', opacity);
            clientG.selectAll('rect').attr('opacity', opacity);
            pathG.selectAll('path').style('display', 'none');

            tG.select('.' + tN + 'ProvinceRect-' + i).attr('opacity', 1);
            tG.select('.' + tN + 'ProvinceRectText-' + i).attr('opacity', 1);
            pathG.selectAll('.pathInRing-' + tN + '-' + i).style('display', '');
            _.forEach(d[forward + 'Provinces'], function(ii) {
                fG.select('.' + fN + 'ProvinceRect-' + ii).attr('opacity', 1);
                fG.select('.' + fN + 'ProvinceRectText-' + ii).attr('opacity', 1);
            });
        }
        resultG.selectAll('text').on('mouseover', function() {
            mouseoverHandle($(this), 5, resultG, 'result', clientG, 'client', 'left');
        }).on('mouseout', mouseoutHandle);
        clientG.selectAll('text').on('mouseover', function() {
            mouseoverHandle($(this), 0, clientG, 'client', resultG, 'result', 'right');
        }).on('mouseout', mouseoutHandle);

        var resultProvinces = srcData[5];
        var p0;
        var p1 = [ cfg.zeroPointX, cfg.zeroPointY ];
        var p2;
        var path;

        svg.select('g.pathInRing')
            .style('display', '')
            .selectAll('path')
            .transition()
            .ease(cfg.ease)
            .duration(cfg.duration)
            .attr({
                d: function() {
                    path = d3.select(this);
                    p0 = clientProvinces[path.attr('data-from')];
                    p2 = resultProvinces[path.attr('data-to')];
                    p0 = [
                        p0.xOnRing,
                        p0.yOnRing
                    ];
                    p2 = [
                        p2.xOnRing,
                        p2.yOnRing
                    ];
                    return makeQbezierDesc(p0, p1, p2);
                }
            });

    }
};

VDNS.prototype.init.prototype = VDNS.prototype;

