/*

[{
    left: ,
    right: ,
    name: ,
    properties: ,
}]

[] [] []

clients = {
    provinces: [
        {}
    ],
    cities: [
        {}
    ],
    isps: [
        {}
    ]
};

results = {
    provinces: [],
    cities: [],
    isps: []
};

*/

var rows = [
    // 1
    [{
        left: null,
        right: [0, 1]
    }, {
        left: null,
        right: [0]
    }, {
        left: null,
        right: [2]
    }, {
        left: null,
        right: [2]
    }],
    // 2
    [{
        left: [0, 1],
        right: [2, 3]
    }, {
        left: [0],
        right: [1]
    }, {
        left: [2, 3],
        right: [0]
    }],
    // 3
    [{
        left: [2],
        right: [0]
    }, {
        left: [1],
        right: [2]
    }, {
        left: [0],
        right: [2]
    }, {
        left: [0],
        right: [1, 3]
    }],
    // 4
    [{
        left: [0],
        right: [0]
    }, {
        left: [3],
        right: [2]
    }, {
        left: [1, 2],
        right: [1]
    }, {
        left: [3],
        right: [1, 2]
    }],
    // 5
    [{
        left: [0],
        right: [1]
    }, {
        left: [2, 3],
        right: [2]
    }, {
        left: [1, 3],
        right: [0, 3]
    }],
    // 6
    [{
        left: [2],
        right: null
    }, {
        left: [0],
        right: null
    }, {
        left: [1],
        right: null
    }, {
        left: [2],
        right: null
    }]
];

function VDNS() {}
VDNS.prototype.set = function(selector) {
    this.container = d3.select(selector);
    this.svg = this.container.append('svg');
    this.svg.attr({
        width: 800,
        height: 300
    });
};
VDNS.prototype.load = function(data) {
    this.sourceData = data;
};
VDNS.prototype.render = function() {
    var self = this;
    var srcData = $.extend([], self.sourceData, true);
    var svg = self.svg;
    var w = svg.attr('width');
    var h = svg.attr('height');

    var padding = 20;
    var xScale = d3.scale.linear()
        .domain([0, srcData.length - 1])
        .range([padding, w - padding])

    function getX(p) {
        return xScale(p);
    }
    function getY(p) {
        return p * 90 + padding;
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
                var p1y = p0y;
                var desc = 'M' + p0x + ',' + p0y + ' ' +
                    'Q' + p1x + ',' + p1y + ' ' + p2x + ',' + p2y + ' ' +
                    'T' + p4x + ',' + p4y;
                svg.append('path')
                    .attr({
                        d: 'M' + p0x + ',' + p0y + ' L' + p0x + ',' + p0y,
                        fill: 'none',
                        stroke: '#333',
                        'stroke-width': 0.5
                    }).attr('d', desc);
                    //.transaction()
                    //.attr('d', desc)
            });
        });
        svg.append('g').selectAll('circle')
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
            x += 1;
            if (x >= 0 && x < data.length) {
            }
        } while(true);
    }


    svg.selectAll('circle').on('click', function() {
        var pi = $(this).attr('data-pi');
        var i = $(this).attr('data-i');
        var data = $.extend([], this.sourceData, true);
        data[pi] = [data[pi][i]];
        toLeft(data, pi, i);

    });
};

var o = new VDNS;
o.set('#div1');
o.load(rows);
o.render();












