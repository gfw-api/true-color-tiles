const Router = require('koa-router');
const ImageService = require('services/image.service');
const logger = require('logger');

const router = new Router({
    prefix: '/true-color-tiles',
});

// https://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
function isInt(value) {
    var x;
    if (isNaN(value)) {
      return false;
    }
    x = parseFloat(value);
    return (x | 0) === x;
  }

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
            const thresh_loss = (ctx.query.thresh === undefined) ? '30' : ctx.query.thresh;

            var threshVals = [10, 15, 20, 25, 30, 50, 75]
            var validThresh = threshVals.includes(parseInt(thresh_loss))

            if (!validThresh) {
              ctx.throw('Thresh supplied not in ' + threshVals)
            }

            var url = 'http://storage.googleapis.com/wri-public/Hansen_16/tiles/hansen_world/v1/tc%threshold/%z/%y/%x.png'
            ctx.params.urlTemplate = url.replace('%threshold', thresh_loss)
            break

          case 'whrc-carbon-loss':
            const thresh_whrc = (ctx.query.thresh === undefined) ? '30' : ctx.query.thresh;
            const minrange = (ctx.query.minrange === undefined) ? 0 : ctx.query.minrange;
            const maxrange = (ctx.query.maxrange === undefined) ? 255 : ctx.query.maxrange;
            const ref_uncertainty = (ctx.query.uncertainty === undefined) ? 127 : ctx.query.uncertainty;

            // Validate parameters
            var threshVals = [10, 15, 20, 25, 30, 50, 75]
            var validThresh = threshVals.includes(parseInt(thresh_whrc))

            if (!validThresh) {
              ctx.throw('Thresh supplied not in ' + threshVals)
            }

            if (!(isInt(minrange) & isInt(maxrange) & isInt(ref_uncertainty))){
              ctx.throw('minrange, maxrange, and ref_uncertainty must all be integers')
            }

            if ((minrange < 0) | (minrange > 255) | (maxrange < 0) | (maxrange > 255) | (ref_uncertainty < 0) | (ref_uncertainty > 255)) {
              ctx.throw('minrange, maxrange, and ref_uncertainty must be between 0 and 255')
            }

            if (minrange > maxrange) {
              ctx.throw('minrange must be larger than maxrange')
            }

            var url = 'http://storage.googleapis.com/earthenginepartners-wri/whrc-hansen-carbon-%threshold-%z/%y/%x.png'

            ctx.params.urlTemplate = url.replace('%threshold', thresh_whrc)
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
