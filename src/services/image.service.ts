import { Context } from "koa";
import { scalePow, ScalePower } from 'd3';
import assert from "assert";
import axios, { AxiosResponse } from "axios";
import { Canvas, createCanvas, Image } from "canvas";
import logger from "logger";

const dataMaxZoom: number = 12;

class ImageService {

    static pad(num: string): string {
        const s: string = `00${num}`;
        return s.substr(s.length - 3);
    }

    static decodeGLAD(data: any, ctx: Context): any {

        const q: Record<string, any> = ctx.query;

        const startDate: number = (q.startDate === undefined) ? 0 : ImageService.dateToInt(q.startDate, 0);
        const endDate: number = (q.endDate === undefined) ? 9999 : ImageService.dateToInt(q.endDate, 9999);
        const showUnconfirmed: boolean = (q.showUnconfirmed === undefined) ? false : ImageService.strToBool(q.showUnconfirmed);

        for (let i: number = 0; i < data.length; i += 4) {

            const band3Str: string = ImageService.pad(data[i + 2].toString());
            const confidence: number = parseInt(band3Str[0], 10) - 1;
            const totalDays: number = data[i] * 255 + data[i + 1];

            if ((totalDays > 0 && totalDays >= startDate && totalDays <= endDate) && (confidence === 1 || showUnconfirmed)) {


                const intensityRaw: number = parseInt(band3Str.slice(1, 3), 10);
                let intensity: number = intensityRaw * 50;

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


    static strToBool(boolStr: string): boolean {
        return (boolStr.toLowerCase() === 'true' || boolStr.toLowerCase() === 'yes' || boolStr === '1');
    }


    static dateToInt(yearStr: string, defaultvalue: number): number {

        function isLeapYear(year: number): boolean {
            return !(year % 4);
        }

        function dayOfYear(year: number, month: number, day: number): number {
            const dayCount: number[] = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

            let dayOfYear: number = dayCount[month] + day;
            if (month > 1 && isLeapYear(year)) dayOfYear++;
            return dayOfYear;
        }

        function baseDays(year: number): number {
            let leapYears: number = 0;
            for (let i: number = baseYear - 1; i < year; i++) {
                leapYears += isLeapYear(i) ? 1 : 0;
            }

            return (year - baseYear) * 365 + leapYears;
        }

        const baseYear: number = 2015;
        let result: number = defaultvalue;


        try {

            logger.debug(`yearStr: ${yearStr}`);

            const year: number = parseInt(yearStr.substring(0, 4), 10);
            const month: number = parseInt(yearStr.substring(5, 7), 10);
            const day: number = parseInt(yearStr.substring(8, 10), 10);

            assert(year >= baseYear);
            assert(month >= 1 && month <= 12);
            assert(day >= 1 && day <= 31);

            result = baseDays(year) + dayOfYear(year, month, day);

        } catch (e) {
            logger.debug(e);
        }

        return result;

    }

    static yearToInt(yearStr: string): number {
        return parseInt(yearStr.slice(-2), 10);
    }

    static decodeLoss(data: any, ctx: Context): any {
        const { z } = ctx.params;
        const q: any = ctx.query;

        const startYear: number = (q.startYear === undefined) ? 0 : ImageService.yearToInt(q.startYear);
        const endYear: number = (q.endYear === undefined) ? 100 : ImageService.yearToInt(q.endYear);

        const exp: number = z < 11 ? 0.3 + ((z - 3) / 20) : 1;

        const myScale: ScalePower<number, number> = scalePow()
            .exponent(exp)
            .domain([0, 256])
            .range([0, 256]);

        for (let i: number = 0; i < data.length; i += 4) {

            if (endYear >= data[i + 2] && data[i + 2] >= startYear) {

                const intensity: number = data[i];

                data[i] = 220;
                data[i + 1] = (72 - z) + 102 - (3 * myScale(intensity) / z);
                data[i + 2] = (33 - z) + 153 - ((intensity) / z);
                data[i + 3] = z < 13 ? myScale(intensity) : intensity;

            } else {
                data[i + 3] = 0;
            }
        }

        return data;
    }

    static getUrl(urlTemplate: string, coords: number[]): string {
        return urlTemplate.replace('%z', coords[2].toString()).replace('%x', coords[1].toString()).replace('%y', coords[0].toString());
    }

    static getZoomSteps(z: number): number {
        return z - dataMaxZoom;
    }

    static getTileCoords(x: number, y: number, z: number): number[] {
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

    static async getImage(reqCtx: Context): Promise<Buffer> {
        logger.info('Getting url');

        const { params } = reqCtx;
        const url: string = this.getUrl(params.urlTemplate, this.getTileCoords(params.x, params.y, params.z));

        const team: Buffer = await axios.get(url, {
            responseType: 'arraybuffer'
        }).then((response: AxiosResponse<any>) => {
            const img: Image = new Image();

            const returnPromise: Promise<Buffer> = new Promise((resolve: (value: any) => void): void => {
                img.onerror = (err: Error):void => {
                    throw err
                };
                img.onload = (): void => {
                    const canvas: Canvas = createCanvas(img.width, img.height);

                    const ctx: any = canvas.getContext('2d');

                    const zsteps: number = ImageService.getZoomSteps(params.z) | 0; // force 32bit int type

                    if (zsteps < 0) {
                        ctx.drawImage(img, 0, 0);
                    } else { // over the maxzoom, we'll need to scale up each tile
                        ctx.imageSmoothingEnabled = false; // disable pic enhancement
                        ctx.mozImageSmoothingEnabled = false;

                        // tile scaling
                        const srcX: number = (256 / Math.pow(2, zsteps) * (params.x % Math.pow(2, zsteps))) | 0;
                        const srcY: number = (256 / Math.pow(2, zsteps) * (params.y % Math.pow(2, zsteps))) | 0;
                        const srcW: number = (256 / Math.pow(2, zsteps)) | 0;
                        const srcH: number = (256 / Math.pow(2, zsteps)) | 0;
                        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, 256, 256);
                    }
                    const I: any = ctx.getImageData(0, 0, canvas.width, canvas.height);

                    if (params.layer === 'glad') {
                        ImageService.decodeGLAD(I.data, reqCtx);
                    } else {
                        ImageService.decodeLoss(I.data, reqCtx);
                    }

                    ctx.putImageData(I, 0, 0);

                    resolve(canvas.toBuffer());
                }
            });

            img.src = Buffer.from(response.data, 'binary');

            return returnPromise;
        });

        return team;
    }

}

export default ImageService;
