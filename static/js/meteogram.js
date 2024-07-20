/*
 * The MIT License
 *
 * Copyright 2016 ismitka.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR
 * ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH
 * THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 *
 * Document : _.js Created on : Oct 23, 2016 Author : ismitka
 */

class Meteogram {
    static get DAY() {
        return 8.64e7;
    };

    static get HOUR() {
        return 3.6e6;
    };

    static get DAY_NAMES() {
        return ["Ne", "Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
    };

    static get sentryUrl() {
        return "https://2fea5fce4b5a49f6b4c8c749361c73e0@sentry.stimulus.com.au/23";
    };

    /**
     * config: {
     *   type: string,
     *   maxwidth: string,
     *   lat: number,
     *   lon: numebr,
     *   detail: string
     * }
     */
    init = (config) => {
        this.config = config;
        this.config.barheight = config.barheight ? parseInt(config.barheight) : 100;
        this.config.style = this.config.style ? this.config.style : "gradient";
        this.config.wrapper = jQuery("#" + this.config.id);
        if (this.config.wrapper.data("config")) {
            var config = this.config.wrapper.data("config");
            this.config.lat = config.lat;
            this.config.lon = config.lon;
        }
        console.log(this.config);
        this.load();
    }
    load = () => {
        this.data = [];
        this.targetPeriod = {
            from: new Date()
        };
        this.targetPeriod.from.setHours(0);
        this.targetPeriod.from.setMinutes(0);
        this.targetPeriod.from.setSeconds(0);
        this.targetPeriod.from.setMilliseconds(0);
        const config = this.config;
        switch (this.config.type) {
            case "at-side":
            case "inline":
                this.loadForecast((response) => {
                    const timeserie = response.properties.timeseries[0];
                    var symbol;
                    var temperature = timeserie.data.instant.details.air_temperature;
                    if (timeserie.data.next_1_hours) {
                        symbol = timeserie.data.next_1_hours.summary.symbol_code;
                    } else if (timeserie.data.next_6_hours) {
                        symbol = timeserie.data.next_6_hours.summary.symbol_code;
                    } else if (timeserie.data.next_12_hours) {
                        symbol = timeserie.data.next_12_hours.summary.symbol_code;
                    }
                    jQuery("[data-symbol]", config.wrapper).attr("src", "/wp-content/plugins/wp-meteogram/static/svg/" + symbol + ".svg");
                    jQuery("[data-temp]", config.wrapper).html(Math.round(temperature) + " &deg;C");
                });
                break;
            default:
                const context = this;
                this.targetPeriod.to = new Date(this.targetPeriod.from.getTime() + (Meteogram.DAY * (this.config.days ? this.config.days : 7)));
                this.loadForecast((response) => {
                    jQuery.each(response.properties.timeseries, function () {
                        context.processCommonTerm(this, context);
                    });
                    context.render(context);
                });
                break;
        }
    }
    processCommonTerm = (response, context) => {
        var date = new Date(response.time);
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        var data = {
            date: date
        };
        if (data = context.pushData(data, context)) {
            if (!data.temperature) {
                data.temperature = {
                    min: 100,
                    max: -100
                }
            }
            var temperature = response.data.instant.details.air_temperature;
            if (temperature >= data.temperature.max) {
                if (response.data.next_1_hours) {
                    data.symbol = response.data.next_1_hours.summary.symbol_code;
                } else if (response.data.next_6_hours) {
                    data.symbol = response.data.next_6_hours.summary.symbol_code;
                } else if (response.data.next_12_hours) {
                    data.symbol = response.data.next_12_hours.summary.symbol_code;
                }
            }
            data.temperature.max = Math.max(data.temperature.max, temperature);
            data.temperature.min = Math.min(data.temperature.min, temperature);
            return data;
        }
        return false;
    }

    pushData = (data, context) => {
        // data is in targetPeriod
        if (data.date.getTime() >= context.targetPeriod.from.getTime() && data.date < context.targetPeriod.to.getTime()) {
            var result;
            jQuery.each(context.data, function (index, item) {
                if (!result) {
                    if (data.date.getTime() == item.date.getTime()) {
                        result = item;
                    }
                }
            });
            if (!result) {
                context.data.push(data);
                return data;
            } else {
                return result;
            }
        }
        return false;
    }

    loadForecast = (callback) => {
        jQuery.ajax({
            url: "/wp-content/plugins/wp-meteogram/proxy.php?ts=" + Date.now(),
            data: {
                lat: this.config.lat,
                lon: this.config.lon
            },
            headers: {"cache-control": "no-cache"},
            type: 'post',
            dataType: 'json',
            success: function (response) {
                callback(response);
            },
            error: function (xhr, status, error) {
                console.log("Can't load forecast");
                Sentry.withScope(function (scope) {
                    scope.setLevel("error");
                    Sentry.setExtra("status", status);
                    Sentry.setExtra("error", error);
                    Sentry.captureMessage("Can't load forecast");
                });
            }
        });
    }

    tempToColor = (t, min, max, mode) => {
        var checkRange = (value) => {
            if (value <= 0) {
                return 0;
            }
            if (value > 255) {
                return 255;
            }
            return value;
        }

        if (!Number.isFinite(t) || !Number.isFinite(min) || !Number.isFinite(max)) {
            throw new TypeError('function tempToColor() expected only numbers');
        }

        if (min > max) {
            throw new Error('minimum cannot be greater than maximum');
        }

        if (t < min) {
            t = min;
        } else if (t > max) {
            t = max;
        }

        const nT = (t - min) / (max - min);
        let rValue = 255;
        let gValue = 255;
        let bValue = 255;

        switch (mode) {
            case 'extended': {
                const regions = [1 / 6, (1 / 6) * 2, (1 / 6) * 3, (1 / 6) * 4, (1 / 6) * 5];
                if (nT <= regions[0]) {
                    rValue = 128 - 6 * nT * 127.999;
                    gValue = 0;
                    bValue = 255;
                } else if (nT > regions[0] && nT <= regions[1]) {
                    rValue = 0;
                    gValue = 1280 - 6 * (1 - nT) * 255.999;
                    bValue = 255;
                } else if (nT > regions[1] && nT <= regions[2]) {
                    rValue = 0;
                    gValue = 255;
                    bValue = 768 - 6 * nT * 255.999;
                } else if (nT > regions[2] && nT <= regions[3]) {
                    rValue = 768 - 6 * (1 - nT) * 255.999;
                    gValue = 255;
                    bValue = 0;
                } else if (nT > regions[3] && nT <= regions[4]) {
                    rValue = 255;
                    gValue = 1280 - 6 * nT * 255.999;
                    bValue = 0;
                } else {
                    rValue = 255;
                    gValue = 0;
                    bValue = 128 - 6 * (1 - nT) * 127.999;
                }
                break;
            }

            case 'half': {
                const regions = [1 / 4, (1 / 4) * 2, (1 / 4) * 3];
                if (nT <= regions[0]) {
                    rValue = 0;
                    gValue = 128 + 4 * nT * 127.999;
                    bValue = 0;
                } else if (nT > regions[0] && nT <= regions[1]) {
                    rValue = 768 - 4 * (1 - nT) * 255.999;
                    gValue = 255;
                    bValue = 0;
                } else if (nT > regions[1] && nT <= regions[2]) {
                    rValue = 255;
                    gValue = 768 - 4 * nT * 255.999;
                    bValue = 0;
                } else {
                    rValue = 128 + 4 * (1 - nT) * 127.999;
                    gValue = 0;
                    bValue = 0;
                }
                break;
            }

            default: {
                const regions = [1 / 4, (1 / 4) * 2, (1 / 4) * 3];
                if (nT <= regions[0]) {
                    rValue = 0;
                    gValue = 4 * nT * 255.999;
                    bValue = 255;
                } else if (nT > regions[0] && nT <= regions[1]) {
                    rValue = 0;
                    gValue = 255;
                    bValue = 512 - 4 * nT * 255.999;
                } else if (nT > regions[1] && nT <= regions[2]) {
                    rValue = 512 - 4 * (1 - nT) * 255.999;
                    gValue = 255;
                    bValue = 0;
                } else {
                    rValue = 255;
                    gValue = 4 * (1 - nT) * 255.999;
                    bValue = 0;
                }
                break;
            }
        }

        return {
            r: checkRange(Math.trunc(rValue)),
            g: checkRange(Math.trunc(gValue)),
            b: checkRange(Math.trunc(bValue))
        };
    }

    render = (context) => {
        if (context.data.length > 0) {
            if (context.config.maxwidth) {
                context.config.wrapper.css("maxWidth", context.config.maxwidth);
            }

            var title;
            if (context.config.type != "daily") {
                title = jQuery("<div/>").addClass("title").html("Předpověď počasí: " + context.formatDate(context.targetPeriod.from))

            } else {
                title = jQuery("<div/>").addClass("title").html("<b>" + context.config.title + "</b>").append(jQuery("<span>").css("float",
                    "right").append("Zdroj: ").append(jQuery("<a/>").attr({
                    href: this.config.detail,
                    target: "_blank"
                }).html("yr.no")));

            }
            context.config.wrapper.append(title);
            var table = jQuery("<table/>");
            var trTime = jQuery("<tr/>").addClass("time");
            var trSymbol = jQuery("<tr/>").addClass("symbol");
            var trTemp = jQuery("<tr/>").addClass("temp");
            var trPrecipitation = jQuery("<tr/>").addClass("precipitation");
            var trWind = jQuery("<tr/>").addClass("wind");
            var trMax = jQuery("<tr/>").addClass("max");
            var trMin = jQuery("<tr/>").addClass("min");
            table.append(trTime).append(trSymbol).append(trMax).append(trTemp).append(trMin);
            if (context.config.type !== "daily") {
                table.append(trWind);
            }
            var temperature = {
                min: 100,
                max: -100
            };
            jQuery.each(context.data, function (index, item) {
                temperature.min = Math.min(item.temperature.min, temperature.min);
                temperature.max = Math.max(item.temperature.max, temperature.max);
            });
            var tempMagnifier = context.config.barheight / (temperature.max - temperature.min);
            jQuery.each(context.data, function (index, item) {
                trMax.append(jQuery("<td/>").html(Math.round(item.temperature.max)));
                trMin.append(jQuery("<td/>").html(Math.round(item.temperature.min)));
            });

            var rangeMin = -15;
            var rangeMax = 40;
            var range = rangeMax - rangeMin;
            jQuery.each(context.data, function (index, item) {
                var trTimeTd = jQuery("<td/>");
                if (context.config.type === "daily") {
                    trTimeTd.append(Meteogram.DAY_NAMES[item.date.getDay()]);
                } else {
                    if (item.from.getTime() + Meteogram.HOUR === item.to.getTime()) {
                        trTimeTd.append(context.formatTime(item.from));
                    } else {
                        trTimeTd.append(context.formatTime(item.from));
                        trTimeTd.append(jQuery("<br/>"));
                        trTimeTd.append(context.formatTime(item.to));
                    }
                }
                trTime.append(trTimeTd);

                trSymbol
                    .append(jQuery("<td/>").append(jQuery("<img/>").attr("src", "/wp-content/plugins/wp-meteogram/static/svg/" + item.symbol + ".svg")));
                var itemTMax = Math.min(rangeMax, Math.round(item.temperature.max));
                var itemTMin = Math.max(rangeMin, Math.round(item.temperature.min));
                var itemTRange = itemTMax - itemTMin;

                var trTempTd = jQuery("<td/>");

                var tempWrapper = jQuery("<div/>").addClass("temp").css({
                    height: itemTRange * tempMagnifier,
                    marginTop: (temperature.max - itemTMax) * tempMagnifier,
                    marginBottom: (itemTMin - temperature.min) * tempMagnifier
                });
                if(context.config.style === "solid") {
                    var {r, g, b} = context.tempToColor(itemTMax, rangeMin, rangeMax);
                    tempWrapper.css({
                        backgroundColor: "rgb(" + r + "," + g + "," + b + ")",
                        backgroundImage: "unset"
                    });
                } else {
                    var backgroundHeight = range * tempMagnifier;
                    var backgroundOffset = (rangeMax - itemTMax) * tempMagnifier;
                    tempWrapper.css({
                        backgroundSize: "100% " + backgroundHeight + "px",
                        backgroundPosition: "0 -" + backgroundOffset + "px"
                    });
                }
                trTempTd.append(tempWrapper).attr("data-temp", Math.round(itemTMax));

                tempWrapper.append(jQuery("<div/>").addClass("hi").html(Math.round(item.temperature.max)));
                tempWrapper.append(jQuery("<div/>").addClass("lo").html(Math.round(item.temperature.min)));
                trTemp.append(trTempTd);

                if (context.config.type !== "daily") {
                    var trPrecipitationTd = jQuery("<td/>");
                    var rain = false;
                    if (item.precipitation.value) {
                        trPrecipitationTd.append(item.precipitation.value);
                        rain = item.precipitation.value > 0;
                    } else if (item.precipitation.min === item.precipitation.max) {
                        trPrecipitationTd.append(item.precipitation.max);
                        rain = item.precipitation.max > 0;
                    } else {
                        trPrecipitationTd.append(item.precipitation.min);
                        trPrecipitationTd.append(" - ");
                        trPrecipitationTd.append(item.precipitation.max);
                        rain = item.precipitation.max > 0;
                    }
                    if (rain) {
                        trPrecipitationTd.append(" mm");
                        trPrecipitation.append(trPrecipitationTd);
                    } else {
                        trPrecipitation.append(jQuery("<td/>").html("&nbsp;"));
                    }

                    var trWindTd = jQuery("<td/>");
                    var windSymbol = jQuery("<img/>").attr({
                        src: "/wp-content/plugins/wp-meteogram/static/img/arrow-down4.svg"
                    }).addClass("windSymbol").css({
                        "-ms-transform": "rotate(" + item.wind.deg + "deg)",
                        "-webkit-transform": "rotate(" + item.wind.deg + "deg)",
                        "transform": "rotate(" + item.wind.deg + "deg)"
                    });
                    trWindTd.append(windSymbol);
                    trWindTd.append(jQuery("<div/>").append(item.wind.speed + " m/s"));
                    trWindTd.append(jQuery("<div/>").append(context.formatWind(item.wind.code, true)));
                    trWind.append(trWindTd);
                }
            });
            var scrollable = jQuery("<div/>").addClass("scrollable").append(table);
            context.config.wrapper.append(scrollable);
        }
    }

    formatDate = (d) => {
        return Meteogram.DAY_NAMES[d.getDay()] + " " + d.getDate() + "." + (d.getMonth() + 1) + ".";
    }

    formatTime = (d) => {
        return (d.getHours() <= 9 ? "0" + d.getHours() : d.getHours()) + ":00";
    }

    formatWind = (code, shortCode) => {
        if (code.length > 1) {
            var result;
            switch (code[0]) {
                case "N":
                    result = shortCode ? "S" : "severo";
                    break;
                case "E":
                    result = shortCode ? "V" : "východo";
                    break;
                case "S":
                    result = shortCode ? "J" : "jiho";
                    break;
                case "W":
                    result = shortCode ? "Z" : "západo";
                    break;
            }
            if (code.length > 2) {
                return result + (shortCode ? "" : "-") + Meteogram.formatWind(code.substring(1), shortCode)
            } else {
                return result + Meteogram.formatWind(code.substring(1), shortCode)
            }
        } else {
            switch (code) {
                case "N":
                    return shortCode ? "S" : "severní";
                case "E":
                    return shortCode ? "V" : "východní";
                case "S":
                    return shortCode ? "J" : "jižní";
                case "W":
                    return shortCode ? "Z" : "západní";
            }
        }
    }
}

var meteogram = function (config) {
    var m = new Meteogram();
    m.init(config);
};
