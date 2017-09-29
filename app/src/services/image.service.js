const logger = require('logger');
const Canvas = require('canvas')
const d3 = require('d3')
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

static decodeLoss (data, z) {

  var exp = z < 11 ? 0.3 + ((z - 3) / 20) : 1;

  var myscale = d3.scalePow()
          .exponent(exp)
          .domain([0,256])
          .range([0,256]);

for (var i = 0; i < data.length; i += 4) {

  if (data[i + 2]  > 0) {

      var intensity = data[i]

      data[i] = 220
      data[i + 1] = (72 - z) + 102 - (3 * myscale(intensity) / z);
      data[i + 2] = (33 - z) + 153 - ((intensity) / z);
      data[i + 3] = z < 13 ? myscale(intensity) : intensity;

  }  else {
    data[i + 3] = 0
  }
}

return data
}

  static async getImage(params) {
    logger.info('Getting url');

    var url = params.baseUrl + params.z + '/' + params.x + '/' + params.y + '.png'

    const team = await rp({ url: url, encoding: null }, function(err, res, body) {
        if (err) throw err;

      }).then(function(body) {

        var img = new Canvas.Image;

        img.src = new Buffer(body, 'binary');
        var canvas = new Canvas(img.width, img.height)

        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        var I = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (params.layer === 'glad') {
            ImageService.decodeGLAD(I.data)
          } else {
            ImageService.decodeLoss(I.data, params.z)
        }

        ctx.putImageData(I, 0, 0)

    return canvas.toBuffer()
  });
    return team;
  }
}
module.exports = ImageService;
