
function vdnsFormat(data) {
    var leftData = {};
    var rightData = {};
    $.each(data, function(k, v) {
        if (v.error === null &&
            v.node_province !== null &&
            v.node_city !== null &&
            v.node_name !== null &&
            v.isp !== null &&
            v.ips && v.ips.length) {

            if (!leftData[v.node_province]) {
                leftData[v.node_province] = {};
            }
            if (!leftData[v.node_province][v.node_city]) {
                leftData[v.node_province][v.node_city] = {};
            }
            if (!leftData[v.node_province][v.node_city][v.isp]) {
                leftData[v.node_province][v.node_city][v.isp] = {
                    __nodeName__: v.node_name,
                    //__localDNS__: v.ldns_ip,
                    __clientIPs__: {}
                };
            }

            $.each(v.ips, function(i, ipObject) {
                leftData[v.node_province][v.node_city][v.isp].__clientIPs__[v.client_ip] = true;
                leftData[v.node_province][v.node_city][v.isp][ipObject.ip] = true;
                var name = ipObject.location.replace(/市|省|回族自治区|壮族自治区|维吾尔自治区/g, ';');
                name = name.replace(/\s/g, '');
                name = name.replace(/国|州|地区/g, function(w) { return w + ';' });
                name = name.split(';');
                name = _.compact(name);
                var province;
                var city;
                var isp;
                switch(name.length) {
                    case 1:
                        isp = city = province = name[0];
                        break;
                    case 2:
                        isp = name[1];
                        city = province = name[0];
                        break;
                    case 3:
                        province = name[0];
                        city = name[1];
                        isp = name[2];
                        break;
                    default:
                        province = city = isp = '未知';
                        break;
                }
                if (!rightData[province]) {
                    rightData[province] = {};
                }
                if (!rightData[province][city]) {
                    rightData[province][city] = {};
                }
                if (!rightData[province][city][isp]) {
                    rightData[province][city][isp] = {
                        __nodeName__: ipObject.location
                        //__resultIPs__: {}
                    };
                }
                //rightData[province][city][isp].__resultIPs__[v.client_ip] = true;
                rightData[province][city][isp][ipObject.ip] = true;
            });
        }
    });

    var ipMap = {};

    function makeArray(data, side1, side2) {

        ipMap[side1] = {};

        var arr = [];
        $.each(data, function(provinceName, d) {
            arr.push({
                province: provinceName,
                cities: d
            });
        });
        arr.sort(function(a, b) {
            return (a.province).localeCompare(b.province);
        });

        var arrProvinces = [];
        var arrCities = [];
        var arrIsps = [];
        var temProvince;
        var temCity;
        var temIsp;
        function subname(name) {
            var len = 4;
            if (name.length > len) {
                return name.substr(0, len) + '...';
            }
            return name;
        }
        $.each(arr, function(idx, d) {
            temProvince = {
                name: subname(d.province),
                fullname: d.province
            };
            temProvince[side1] = null;
            temProvince[side2] = [];
            arrProvinces.push(temProvince);
            $.each(d.cities, function(city, isps) {
                temCity = {
                    name: subname(city),
                    fullname: city
                };
                temCity[side1] = [arrProvinces.length - 1];
                temCity[side2] = [];
                arrCities.push(temCity);
                temProvince[side2].push(arrCities.length - 1);
                $.each(isps, function(isp, ips) {
                    temIsp = {
                        name: subname(isp),
                        nodeName: ips.__nodeName__,
                        ips: ips
                    };
                    delete ips.__nodeName__;
                    if (ips.__clientIPs__) {
                        temIsp.clientIPs = ips.__clientIPs__;
                        delete ips.__clientIPs__;
                    }
                    temIsp[side1] = [arrCities.length - 1];
                    temIsp[side2] = [];
                    arrIsps.push(temIsp);
                    temCity[side2].push(arrIsps.length - 1);
                    $.each(ips, function(ip, bool) {
                        if(!ipMap[side1][ip]) {
                            ipMap[side1][ip] = [];
                        }
                        ipMap[side1][ip].push(arrIsps.length - 1);
                    });
                });
            });
        });
        if (side1 == 'left') {
            return [
                arrProvinces,
                arrCities,
                arrIsps
            ];
        }
        return [
            arrIsps,
            arrCities,
            arrProvinces
        ];
    }

    leftData = makeArray(leftData, 'left', 'right');
    rightData = makeArray(rightData, 'right', 'left');

    function connect() {
        $.each(leftData[2], function(k, isp) {
            $.each(isp.ips, function(ip, bool) {
                isp.right = isp.right.concat(ipMap.right[ip]);
            });
            isp.right = _.uniq(isp.right);
        });
        $.each(rightData[0], function(k, isp) {
            $.each(isp.ips, function(ip, bool) {
                isp.left = isp.left.concat(ipMap.left[ip]);
            });
            isp.left = _.uniq(isp.left);
        });

    }

    connect();

    return leftData.concat(rightData);
}

