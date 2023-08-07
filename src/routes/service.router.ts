import Router from 'koa-router';
import logger from 'logger';
import { Context } from 'koa';
import ImageService from "services/image.service";


const router: Router = new Router({
    prefix: '/api/v1/true-color-tiles',
});

class Service {

    static async drawTile(ctx: Context): Promise<void> {
        const url: string = 'http://storage.googleapis.com/wri-public/Hansen18/tiles/hansen_world/v1/tc%thresh/%z/%y/%x.png';

        switch (ctx.params.layer) {

            case 'glad':
                ctx.params.urlTemplate = 'http://tiles.globalforestwatch.org/glad_prod/tiles/%z/%y/%x.png';
                break;

            case 'loss':
                ctx.params.urlTemplate = url.replace('%thresh', Service.validateThresh(ctx));
                break;

            default:
                ctx.throw(400, 'Wrong layer parameter supplied, should be loss or glad');

        }

        let image: Buffer;

        try {
            image = await ImageService.getImage(ctx);
            ctx.body = image;
        } catch (e) {
            logger.error(e);
            ctx.throw(500, 'Error while retrieving image');
        }

    }

    static validateThresh(ctx: Context): string {
        const thresh: string = (ctx.query.thresh === undefined) ? '30' : ctx.query.thresh as string;

        const threshValues: number[] = [10, 15, 20, 25, 30, 50, 75];
        const validThresh: boolean = threshValues.includes(parseInt(thresh, 10));

        if (!validThresh) {
            ctx.throw(`Thresh supplied not in ${threshValues}`);
        }

        return thresh;
    }

}

router.get('/:layer/:z/:x/:y', Service.drawTile);

export default router;
