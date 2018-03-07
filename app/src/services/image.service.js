const logger = require('logger');
const Canvas = require('canvas')
const d3 = require('d3')
const rp = require('request-promise');
const dataMaxZoom = 12

class ImageService {

  static pad (num) {
  	var s = '00' + num;
  	return s.substr(s.length - 3);
  }

  static decodeGLAD (data) {
    // FROM: https://github.com/Vizzuality/gfw/blob/develop/app/assets/javascripts/map/views/layers/GladLayer.js
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

  static yearToInt (yearStr) {
    return parseInt(yearStr.slice(-2));
  }

  static decodeLoss (data, ctx) {
    // FROM: https://github.com/Vizzuality/gfw/blob/develop/app/assets/javascripts/map/views/layers/LossLayer.js
    var z = ctx.params.z
    var q = ctx.query

    var startYear = (q.startYear === undefined) ? 0 : ImageService.yearToInt(q.startYear);
    var endYear = (q.endYear === undefined) ? 100 : ImageService.yearToInt(q.endYear);

    var exp = z < 11 ? 0.3 + ((z - 3) / 20) : 1;

    var myscale = d3.scalePow()
            .exponent(exp)
            .domain([0,256])
            .range([0,256]);

    for (var i = 0; i < data.length; i += 4) {

      if (endYear >= data[i + 2] && data[i + 2] >= startYear) {

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

  static decodeWHRC(data, ctx) {
     // FROM: https://github.com/Vizzuality/gfw-climate/blob/e5b89021edb8766de83d03419e646edd313ce258/app/assets/javascripts/map/views/layers/CarbonStocksLayer.js
     var q = ctx.query

     var minrange = (q.minrange === undefined) ? 0 : q.minrange;
     var maxrange = (q.maxrange === undefined) ? 255 : q.maxrange;
     var ref_uncertainty = (q.uncertainty === undefined) ? 127 : q.uncertainty;

     // create buckets
     var buckets = [39, 11,  3, // first bucket R G B
              83, 44,  8,
              130, 104,  26,
              174, 176, 49,
              173, 209, 81,
              179, 249, 122]; // last bucket
     // cache bucket length
     var countBuckets = buckets.length / 3 |0;

     // find pixel position
     for (var pixelPos = 0; pixelPos < data.length; pixelPos += 4) {

         // get values from imgdata
         var carbonStock = data[pixelPos + 2] | 0;
         var uncertainty = data[pixelPos + 3] | 0;
         // scale values
         uncertainty = uncertainty > 100 ? 100 : (uncertainty < 0 ? 0 : uncertainty);
         // init set alpha to 0
         data[pixelPos + 3] = 0;

         if(carbonStock >= minrange && carbonStock <= maxrange) {
           if(ref_uncertainty === 0) {
             // min uncertainty subtract the percentage of uncertainty
             carbonStock = carbonStock - (uncertainty * carbonStock / 100);
             carbonStock = carbonStock < 1 ? 1 : carbonStock;
           } else if(ref_uncertainty === 254) {
             // max uncertainty sum the uncertainty value
             carbonStock = carbonStock + (uncertainty * carbonStock / 100);
           }

           // Calc bucket from carbonStock as a factor of bucket number
           var bucket = (carbonStock * countBuckets) / maxrange;
           // Find floor to give bucket index
           var bucketIndex = ~~bucket;
           data[pixelPos] = buckets[bucketIndex * 3];
           data[pixelPos + 1] = buckets[bucketIndex * 3 + 1];
           data[pixelPos + 2] = buckets[bucketIndex * 3 + 2];
           data[pixelPos + 3] = carbonStock;
         }
       }

       return data

   }

  static _getUrl (urlTemplate, coords) {
	   return urlTemplate.replace('%z', coords[2]).replace('%x', coords[1]).replace('%y', coords[0]);
  }

  static _getZoomSteps (z) {
	   return z - dataMaxZoom;
  }

  static _getTileCoords (x, y, z) {
  	if (z > dataMaxZoom) {
  	  x = Math.floor(x / (Math.pow(2, z - dataMaxZoom)));
  	  y = Math.floor(y / (Math.pow(2, z - dataMaxZoom)));
  	  z = dataMaxZoom;
  	} else {
  	  y = (y > Math.pow(2, z) ? y % Math.pow(2, z) : y);
  	  if (x >= Math.pow(2, z)) {
  		    x = x % Math.pow(2, z);
  	  } else if (x < 0) {
  		    x = Math.pow(2, z) - Math.abs(x);
  	  }
  	}
  	return [x, y, z];
  }

  static async getImage(reqCtx) {
    var params = reqCtx.params
    var url = this._getUrl(params.urlTemplate, this._getTileCoords(params.x, params.y, params.z));

    const team = await rp({ url: url, encoding: null }, function(err, res, body) {
        if (err) {
          throw err;
        }
      }).then(function(body) {

        var img = new Canvas.Image;

        img.src = new Buffer(body, 'binary');
        var canvas = new Canvas(img.width, img.height)

        var ctx = canvas.getContext('2d');

        var zsteps = ImageService._getZoomSteps(params.z) | 0; // force 32bit int type
        // ctx.clearRect(0, 0, 256, 256);                    // this will allow us to sum up the dots when the timeline is running
        if (zsteps < 0) {
          ctx.drawImage(img, 0, 0);
        } else {                                          // over the maxzoom, we'll need to scale up each tile
          ctx.imageSmoothingEnabled = false;              // disable pic enhancement
          ctx.mozImageSmoothingEnabled = false;

          // tile scaling
          var srcX = (256 / Math.pow(2, zsteps) * (params.x % Math.pow(2, zsteps))) |0,
            srcY = (256 / Math.pow(2, zsteps) * (params.y % Math.pow(2, zsteps))) |0,
            srcW = (256 / Math.pow(2, zsteps)) |0,
            srcH = (256 / Math.pow(2, zsteps)) |0;
          ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, 256, 256);
        }
        var I = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (params.layer === 'glad') {
            ImageService.decodeGLAD(I.data)
          } else if (params.layer === 'loss') {
            ImageService.decodeLoss(I.data, reqCtx)
          } else if (params.layer === 'whrc-biomass') {
            ImageService.decodeWHRC(I.data, reqCtx)
        }

        ctx.putImageData(I, 0, 0);

    return canvas.toBuffer()
  });
    return team;
  }
}

module.exports = ImageService;
