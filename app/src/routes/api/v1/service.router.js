const Router = require('koa-router');
const ImageService = require('services/image.service');
const logger = require('logger');


const router = new Router({
    prefix: '/true-color-tiles',
});

class Service {

    static async drawTile(ctx) {
        const layer = ctx.params.layer
        const z = ctx.params.z
        const x = ctx.params.x
        const y = ctx.params.y

        switch (ctx.params.layer) {

          case 'glad':
            ctx.params.urlTemplate = 'http://wri-tiles.s3.amazonaws.com/glad_prod/tiles/%z/%y/%x.png'
            break

          case 'loss':
            const thresh = (ctx.query.thresh === undefined) ? '30' : ctx.query.thresh;

            var threshVals = [10, 15, 20, 25, 30, 50, 75]
            var validThresh = threshVals.includes(parseInt(thresh))

            if (!validThresh) {
              ctx.throw('Thresh supplied not in ' + threshVals)
            }

            var url = 'http://storage.googleapis.com/wri-public/Hansen_16/tiles/hansen_world/v1/tc%thresh/%z/%y/%x.png'
            ctx.params.urlTemplate = url.replace('%thresh', thresh)
            break


          case 'treeCover2010':

            const thresh = (ctx.query.thresh === undefined) ? '30' : ctx.query.thresh;

            var threshVals = [10, 15, 20, 25, 30, 50, 75]
            var validThresh = threshVals.includes(parseInt(thresh))

            if (!validThresh) {
              ctx.throw('Thresh supplied not in ' + threshVals)
            }
            var url = 'https://storage.googleapis.com/wri-public/treecover/2010/%thresh/%z/%y/%x.png'
            ctx.params.urlTemplate = url.replace('%thresh', thresh)
            break

          default:
            ctx.throw(400, 'Wrong layer parameter supplied, should be loss or glad');
        }

        let image;

        try {
            image = await ImageService.getImage(ctx);
            ctx.body = image
          } catch (e) {
            logger.error(e);
            ctx.throw(500, 'Error while retrieving image');
          }

    }

}

router.get('/:layer/:z/:x/:y', Service.drawTile);

module.exports = router;
