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

          // REACH THROUGH : http://mymachine:9000/v1/true-color-tiles/glad/{z}/{x}/{y}
          case 'glad':
            ctx.params.urlTemplate = 'http://wri-tiles.s3.amazonaws.com/glad_prod/tiles/%z/%y/%x.png'
            break

          // REACH THROUGH : http://mymachine:9000/v1/true-color-tiles/loss/{z}/{x}/{y}
          case 'loss':
            const thresh_loss = (ctx.query.thresh === undefined) ? '30' : ctx.query.thresh;

            console.log('query')
            console.log(ctx.query)
            var threshVals = [10, 15, 20, 25, 30, 50, 75]
            var validThresh = threshVals.includes(parseInt(thresh_loss))

            if (!validThresh) {
              ctx.throw('Thresh supplied not in ' + threshVals)
            }

            var url = 'http://storage.googleapis.com/wri-public/Hansen_16/tiles/hansen_world/v1/tc%threshold/%z/%y/%x.png'
            ctx.params.urlTemplate = url.replace('%threshold', thresh_loss)
            console.log(ctx.params.urlTemplate)
            break

          // REACH THROUGH: http://mymachine:9000/v1/true-color-tiles/whrc-carbon-loss/{z}/{x}/{y}
          case 'whrc-carbon-loss':
            const thresh_whrc = (ctx.query.thresh === undefined) ? '30' : ctx.query.thresh;

            logger.info('query')
            logger.info(ctx.query)
            var threshVals = [10, 15, 20, 25, 30, 50, 75]
            var validThresh = threshVals.includes(parseInt(thresh_whrc))

            if (!validThresh) {
              ctx.throw('Thresh supplied not in ' + threshVals)
            }

            // var url = 'http://storage.googleapis.com/earthenginepartners-wri/whrc-hansen-carbon-%threshold-%z/%x/%y.png'
            // hardcode threshold at 30
            var url = 'http://storage.googleapis.com/earthenginepartners-wri/whrc-hansen-carbon-%threshold-%z/%x/%y.png'

            ctx.params.urlTemplate = url.replace('%threshold', thresh_whrc)
            logger.info(ctx.params.urlTemplate)
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
