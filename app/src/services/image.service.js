const logger = require('logger');
const Canvas = require('canvas')
const rp = require('request-promise');


class ImageService {

  static pad (num) {
  	var s = '00' + num;
  	return s.substr(s.length - 3);
  }

  static decodeGLAD (data) {

  for (var i = 0; i < data.length; i += 4) {

  	var total_days = data[i] * 255 + data[i + 1];

    if (total_days > 0) {

    	var band3_str = ImageService.pad(data[i+2].toString());
    	var confidence = parseInt(band3_str[0]) - 1
    	var intensity_raw = parseInt(band3_str.slice(1, 3))
    	var intensity = intensity_raw * 50

    	if (intensity > 255) {
    	  intensity = 255
    	}

        data[i] = 220
  		  data[i + 1] = 102,
  		  data[i + 2] = 153
  		  data[i + 3] = intensity

    }  else {
      data[i + 3] = 0
    }
  }

  return data
}


  static async getImage(url) {
    logger.info('Getting url');
    const team = await rp({ url: url, encoding: null }, function(err, res, body) {
        if (err) throw err;

      }).then(function(body) {

        var img = new Canvas.Image;

        img.src = new Buffer(body, 'binary');
        var canvas = new Canvas(img.width, img.height)

        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        var I = ctx.getImageData(0, 0, canvas.width, canvas.height);

        ImageService.decodeGLAD(I.data)
        ctx.putImageData(I, 0, 0)

        console.log(img.width, img.height)

    return canvas.toBuffer()
  });
    return team;
  }
}
module.exports = ImageService;
