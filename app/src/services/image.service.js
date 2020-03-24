/* eslint-disable no-restricted-properties,no-param-reassign,no-mixed-operators,no-use-before-define,no-undef,no-bitwise */
const logger = require('logger');
const Canvas = require('canvas');
const d3 = require('d3');
const rp = require('request-promise');

const dataMaxZoom = 12;
const assert = require('assert');

class ImageService {

    static pad(num) {
        const s = `00${num}`;
        return s.substr(s.length - 3);
    }

    static decodeGLAD(data, ctx) {

        const q = ctx.query;

        const startDate = (q.startDate === undefined) ? 0 : ImageService.dateToInt(q.startDate, 0);
        const endDate = (q.endDate === undefined) ? 9999 : ImageService.dateToInt(q.endDate, 9999);
        const showUnconfirmed = (q.showUnconfirmed === undefined) ? false : ImageService.strToBool(q.showUnconfirmed);

        for (let i = 0; i < data.length; i += 4) {

            const band3Str = ImageService.pad(data[i + 2].toString());
            const confidence = parseInt(band3Str[0], 10) - 1;
            const totalDays = data[i] * 255 + data[i + 1];

            if ((totalDays > 0 && totalDays >= startDate && totalDays <= endDate) && (confidence === 1 || showUnconfirmed)) {


                const intensityRaw = parseInt(band3Str.slice(1, 3), 10);
                let intensity = intensityRaw * 50;

                if (intensity > 255) {
                    intensity = 255;
                }

                data[i] = 220;
                data[i + 1] = 102;
                data[i + 2] = 153;
                data[i + 3] = intensity;

            } else {
                data[i + 3] = 0;
            }
        }

        return data;
    }


    static strToBool(boolStr) {
        if (boolStr.toLowerCase() === 'true' || boolStr.toLowerCase() === 'yes' || boolStr === '1') return true;
        return false;

    }


    static dateToInt(yearStr, defaultvalue) {

        function isLeapYear(year) {
            return !(year % 4);
        }

        function dayOfYear() {
            const dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

            let dayOfYear = dayCount[month] + day;
            if (month > 1 && isLeapYear(year)) dayOfYear++;
            return dayOfYear;
        }

        function baseDays() {
            let leapYears = 0;
            for (let i = baseYear - 1; i < year; i++) {
                leapYears += isLeapYear(i) ? 1 : 0;
            }

            return (year - baseYear) * 365 + leapYears;
        }

        const baseYear = 2015;
        let result = defaultvalue;


        try {

            logger.debug(`yearStr: ${yearStr}`);

            const year = parseInt(yearStr.substring(0, 4), 10);
            const month = parseInt(yearStr.substring(5, 7), 10);
            const day = parseInt(yearStr.substring(8, 10), 10);

            assert(year >= baseYear);
            assert(month >= 1 && month <= 12);
            assert(day >= 1 && day <= 31);

            result = baseDays() + dayOfYear();

        } catch (e) {
            logger.debug(e);
        }

        return result;

    }

    static yearToInt(yearStr) {
        return parseInt(yearStr.slice(-2), 10);
    }

    static decodeLoss(data, ctx) {

        const { z } = ctx.params;
        const q = ctx.query;

        const startYear = (q.startYear === undefined) ? 0 : ImageService.yearToInt(q.startYear);
        const endYear = (q.endYear === undefined) ? 100 : ImageService.yearToInt(q.endYear);

        const exp = z < 11 ? 0.3 + ((z - 3) / 20) : 1;

        const myscale = d3.scalePow()
            .exponent(exp)
            .domain([0, 256])
            .range([0, 256]);

        for (let i = 0; i < data.length; i += 4) {

            if (endYear >= data[i + 2] && data[i + 2] >= startYear) {

                const intensity = data[i];

                data[i] = 220;
                data[i + 1] = (72 - z) + 102 - (3 * myscale(intensity) / z);
                data[i + 2] = (33 - z) + 153 - ((intensity) / z);
                data[i + 3] = z < 13 ? myscale(intensity) : intensity;

            } else {
                data[i + 3] = 0;
            }
        }

        return data;
    }

    static getUrl(urlTemplate, coords) {
        return urlTemplate.replace('%z', coords[2]).replace('%x', coords[1]).replace('%y', coords[0]);
    }

    static getZoomSteps(z) {
        return z - dataMaxZoom;
    }

    static getTileCoords(x, y, z) {
        if (z > dataMaxZoom) {
            x = Math.floor(x / (Math.pow(2, z - dataMaxZoom)));
            y = Math.floor(y / (Math.pow(2, z - dataMaxZoom)));
            z = dataMaxZoom;
        } else {
            y = (y > Math.pow(2, z) ? y % Math.pow(2, z) : y);
            if (x >= Math.pow(2, z)) {
                x %= Math.pow(2, z);
            } else if (x < 0) {
                x = Math.pow(2, z) - Math.abs(x);
            }
        }
        return [x, y, z];
    }

    static async getImage(reqCtx) {
        logger.info('Getting url');

        const { params } = reqCtx;
        const url = this.getUrl(params.urlTemplate, this.getTileCoords(params.x, params.y, params.z));

        const team = await
        rp({ url, encoding: null }, (err) => {
            if (err) throw err;

        }).then((body) => {

            const img = new Canvas.Image();

            // eslint-disable-next-line no-buffer-constructor
            img.src = new Buffer(body, 'binary');
            const canvas = new Canvas(img.width, img.height);

            const ctx = canvas.getContext('2d');

            const zsteps = ImageService.getZoomSteps(params.z) | 0; // force 32bit int type
            // ctx.clearRect(0, 0, 256, 256);                    // this will allow us to sum up the dots when the timeline is running
            if (zsteps < 0) {
                ctx.drawImage(img, 0, 0);
            } else { // over the maxzoom, we'll need to scale up each tile
                ctx.imageSmoothingEnabled = false; // disable pic enhancement
                ctx.mozImageSmoothingEnabled = false;

                // tile scaling
                const srcX = (256 / Math.pow(2, zsteps) * (params.x % Math.pow(2, zsteps))) | 0;
                const srcY = (256 / Math.pow(2, zsteps) * (params.y % Math.pow(2, zsteps))) | 0;
                const srcW = (256 / Math.pow(2, zsteps)) | 0;
                const srcH = (256 / Math.pow(2, zsteps)) | 0;
                ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, 256, 256);
            }
            const I = ctx.getImageData(0, 0, canvas.width, canvas.height);

            if (params.layer === 'glad') {
                ImageService.decodeGLAD(I.data, reqCtx);
            } else {
                ImageService.decodeLoss(I.data, reqCtx);
            }

            ctx.putImageData(I, 0, 0);

            return canvas.toBuffer();
        });
        return team;
    }

}

module.exports = ImageService;
