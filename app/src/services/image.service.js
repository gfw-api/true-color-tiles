const logger = require('logger');
const Canvas = require('canvas');
//const { Image } = require('canvas');
//const { createCanvas, loadImage } = require('canvas')
const rp = require('request-promise');


class ImageService {
  static async getImage(url) {
    logger.info('Getting url');
    const team = await rp({ url: url, encoding: null }, function(err, res, body) {
        if (err) throw err;

      }).then(function(body) {

        var img = new Canvas.Image;
        //var canvas = new Canvas()
        //img.src = canvas.toBuffer()

        img.src = new Buffer(body, 'binary');
        var canvas = new Canvas(img.width, img.height)

        //img.src = canvas.toBuffer()
        console.log('here')

        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        ctx.font = '80px Arial'
        ctx.rotate(0.1)
        ctx.fillText('Awesome!', 50, 100)

        // ctx.drawImage(img, 0, 0, 50, 50);
        // ctx.drawImage(img, 50, 0, 50, 50);
        // ctx.drawImage(img, 100, 0, 50, 50);
        console.log(img.width, img.height)

        //console.log(canvas.toDataURL())
        console.log('<img src="' + canvas.toDataURL() + '" />')

        //console.log(canvas.toDataURL())
        //console.log(canvas.toBuffer())

    console.log('returning')
    //console.log(team)
    return canvas.toBuffer()
    //return Object.assign({}, team.data, { out: team.out });
  });
    return team;
  }
}
module.exports = ImageService;
