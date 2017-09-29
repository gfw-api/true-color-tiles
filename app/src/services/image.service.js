const logger = require('logger');
const Canvas = require('canvas');
const request = require('request');


class ImageService {
  static async getImage(url) {
    logger.info('Getting url');
    const team = await request.get({ url: url, encoding: null }, function(err, res, body) {
        if (err) throw err;

        var image = new Canvas.Image();

        image.src = new Buffer(body, 'binary');
        var canvas = new Canvas(image.width, image.height);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, image.width / 4, image.height / 4);
        console.log(image.width, image.height)

        return canvas.toDataURL()
        //console.log(canvas.toDataURL())
        //console.log(canvas.toBuffer())
    });
    console.log(team)

    return team;
  }
}
module.exports = ImageService;
