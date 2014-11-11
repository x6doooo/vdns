
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

vdns.prototype = {
    constructor: vdns,

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
            height: height || 800
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
            d.rad = getRad(getIdxOnRing(i));
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
        var clientProvinces = srcData[0];
        var resultProvinces = srcData[1];
        _.forEach(clientProvinces, function(cpr, idx) {
            _.forEach(cpr.rightProvinces, function(rprIdx) {
                g.append('path')
                    .attr({
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
                    })
            })
        })

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
                    .attr({
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
                    .text(function(item) {
                        return item.name;
                    })
                    .attr({
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

        clientG.style('display', '')
            .selectAll('rect')
            .transition()
            .attr(positionObjRect);

        resultG.style('display', '')
            .selectAll('rect')
            .transition()
            .attr(positionObjRect);

        clientG.selectAll('text')
            .transition()
            .attr(positionObj);

        resultG.selectAll('text')
            .transition()
            .attr(positionObj);

        var clientProvinces = srcData[0];
        var resultProvinces = srcData[5];
        var rpr;
        var p0;
        var p1 = [
            cfg.zeroPointX,
            cfg.zeroPointY
        ];
        var p2;
        var path;

        svg.select('g.pathInRing')
            .style('display', '')
            .selectAll('path')
            .transition()
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

vdns.prototype.init.prototype = vdns.prototype;

