
// 清洗TASK_DATA数据
vdns.wash = function(taskData) {

    var clients = {};
    var results = {};

    var clientProvinceObj;
    var clientCityObj;
    var clientIspObj;

    var resultName;
    var resultProvince;
    var resultCity;
    var resultIsp;

    var resultProvinceObj;
    var resultCityObj;
    var resultIspObj;

    $.each(taskData, function(k, v) {
        // 排除不完整的数据
        if (v.error === null &&
            v.node_province !== null &&
            v.node_city !== null &&
            v.node_name !== null &&
            v.isp !== null &&
            v.ips && v.ips.length)
        {
            clientProvinceObj = clients[v.node_province];
            if (!clientProvinceObj) {
                clientProvinceObj = clients[v.node_province] = {
                    __resultProvinces__: {},
                    __nodes__: {}
                };
            }

            clientCityObj = clientProvinceObj.__nodes__[v.node_city];
            if (!clientCityObj) {
                clientCityObj = clientProvinceObj.__nodes__[v.node_city] = {};
            }

            clientIspObj = clientCityObj[v.isp];
            if (!clientIspObj) {
                clientIspObj = clientCityObj[v.isp] = {
                    __nodeName__: v.node_name,
                    __localDNS__: v.ldns_ip,
                    __clientIPs__: {},
                    __resultIPs__: {}
                };
            }

            _.forEach(v.ips, function(objIP, i) {
                clientIspObj.__clientIPs__[v.client_ip] = true;
                clientIspObj.__resultIPs__[objIP.ip] = true;
                resultName = objIP.location.replace(/市|省|回族自治区|壮族自治区|维吾尔自治区/g, ';');
                resultName = resultName.replace(/\s/g, '');
                resultName = resultName.replace(/国|州|地区/g, function(w) { return w + ';' });
                resultName = resultName.split(';');
                resultName = _.compact(resultName);

                switch(resultName.length) {
                    case 1:
                        resultIsp = resultCity = resultProvince = resultName[0];
                        break;
                    case 2:
                        resultIsp = resultName[1];
                        resultCity = resultProvince = resultName[0];
                        break;
                    case 3:
                        resultProvince = resultName[0];
                        resultCity = resultName[1];
                        resultIsp = resultName[2];
                        break;
                    default:
                        resultProvince = resultCity = resultIsp = '未知';
                        break;
                }

                clientProvinceObj.__resultProvinces__[resultProvince] = true;

                resultProvinceObj = results[resultProvince];
                if (!resultProvinceObj) {
                    resultProvinceObj = results[resultProvince] = {
                        __clientProvinces__: {},
                        __nodes__: {}
                    };
                }
                resultProvinceObj.__clientProvinces__[v.node_province] = true;

                resultCityObj = resultProvinceObj.__nodes__[resultCity];
                if (!resultCityObj) {
                    resultCityObj = resultProvinceObj.__nodes__[resultCity] = {};
                }

                resultIspObj = resultCityObj[resultIsp];
                if (!resultIspObj) {
                    resultIspObj = resultCityObj[resultIsp] = {
                        __nodeName__: objIP.location,
                        __IPs__: {}
                    };
                }
                resultIspObj.__IPs__[objIP.ip] = true;
            });
        }
    });

    var ipMap = {};
    var provinceMap = {};
    function subName(name) {
        var len = 4;
        if (name.length > len) {
            return name.substr(0, len) + '...';
        }
        return name;
    }

    function makeArray(data, side1, side2) {

        ipMap[side1] = {};
        provinceMap[side1] = {};

        var arr = [];
        _.forIn(data, function(d, provinceName) {
            arr.push({
                province: provinceName,
                cities: d.__nodes__,
                connectProvinces: d.__clientProvinces__ || d.__resultProvinces__
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
        var temArrIPs;
        _.forEach(arr, function(d, idx) {
            temProvince = {
                name: subName(d.province),
                fullname: d.province,
                connectProvinces: d.connectProvinces
            };
            temProvince[side1] = null;
            temProvince[side2] = [];
            arrProvinces.push(temProvince);

            if (!provinceMap[side1][d.province]) {
                provinceMap[side1][d.province] = [];
            }
            provinceMap[side1][d.province].push(arrProvinces.length - 1);

            _.forIn(d.cities, function(isps, city) {
                temCity = {
                    name: subName(city),
                    fullname: city
                };
                temCity[side1] = [arrProvinces.length - 1];
                temCity[side2] = [];
                arrCities.push(temCity);
                temProvince[side2].push(arrCities.length - 1);
                _.forIn(isps, function(ips, isp) {
                    temIsp = {
                        name: subName(isp),
                        nodeName: ips.__nodeName__,
                        ips: ips
                    };
                    if (ips.__clientIPs__) {
                        temIsp.clientIPs = ips.__clientIPs__;
                    }
                    if (ips.__localDNS__) {
                        temIsp.localDNS = ips.__localDNS__;
                    }
                    temIsp[side1] = [arrCities.length - 1];
                    temIsp[side2] = [];
                    arrIsps.push(temIsp);
                    temCity[side2].push(arrIsps.length - 1);
                    temArrIPs = ips.__resultIPs__ || ips.__IPs__;
                    _.forIn(temArrIPs, function(bool, ip) {
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

    clients = makeArray(clients, 'left', 'right');
    results = makeArray(results, 'right', 'left');

    // connect isp
    _.forEach(clients[2], function(isp) {
        _.forIn(isp.ips.__resultIPs__, function(bool, ip) {
            isp.right = isp.right.concat(ipMap.right[ip]);
        });
        isp.right = _.uniq(isp.right);
    });
    _.forEach(results[0], function(isp) {
        _.forIn(isp.ips.__IPs__, function(bool, ip) {
            isp.left = isp.left.concat(ipMap.left[ip]);
        });
        isp.left = _.uniq(isp.left);
    });

    // connect province
    _.forEach(clients[0], function(province) {
        province.rightProvinces = [];
        _.forIn(province.connectProvinces, function(bool, pr) {
            province.rightProvinces = province.rightProvinces.concat(provinceMap.right[pr]);
        });
        delete province.connectProvinces;
        province.rightProvinces = _.uniq(province.rightProvinces);
    });
    _.forEach(results[2], function(province) {
        province.leftProvinces = [];
        _.forIn(province.connectProvinces, function(bool, pr) {
            province.leftProvinces = province.leftProvinces.concat(provinceMap.left[pr]);
        })
        delete province.connectProvinces;
        province.leftProvinces = _.uniq(province.leftProvinces);
    });
    return clients.concat(results);
};
