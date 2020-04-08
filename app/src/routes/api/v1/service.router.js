const Router = require('koa-router');
const ImageService = require('services/image.service');
const logger = require('logger');


const router = new Router({
    prefix: '/true-color-tiles',
});

class Service {

    static async drawTile(ctx) {
        const url = 'http://storage.googleapis.com/wri-public/Hansen18/tiles/hansen_world/v1/tc%thresh/%z/%y/%x.png';

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

        let image;

        try {
            image = await ImageService.getImage(ctx);
            ctx.body = image;
        } catch (e) {
            logger.error(e);
            ctx.throw(500, 'Error while retrieving image');
        }

    }

    static validateThresh(ctx) {
        const thresh = (ctx.query.thresh === undefined) ? '30' : ctx.query.thresh;

        const threshVals = [10, 15, 20, 25, 30, 50, 75];
        const validThresh = threshVals.includes(parseInt(thresh, 10));

        if (!validThresh) {
            ctx.throw(`Thresh supplied not in ${threshVals}`);
        }

        return thresh;
    }

}

router.get('/:layer/:z/:x/:y', Service.drawTile);

module.exports = router;
