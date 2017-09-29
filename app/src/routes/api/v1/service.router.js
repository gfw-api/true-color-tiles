const Router = require('koa-router');
const ImageService = require('services/image.service');
const logger = require('logger');


const router = new Router({
    prefix: '/true-color-tiles',
});

class Service {

    static async sayHi(ctx) {
        const layer = ctx.params.layer
        const z = ctx.params.z
        const x = ctx.params.x
        const y = ctx.params.y

        var url = 'http://farm8.staticflickr.com/7333/11286633486_070f0d33bc_n.jpg';

        let image;

        try {
            image = await ImageService.getImage(url);
            console.log(image)
            //ctx.body = image.pngStream()
            ctx.body = image
          } catch (e) {
            logger.error(e);
            ctx.throw(500, 'Error while retrieving image');
          }

    }

}

router.get('/:layer/:z/:x/:y', Service.sayHi);

module.exports = router;
