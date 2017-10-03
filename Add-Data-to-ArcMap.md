# Adding tiled data to ArcMap


#### Grab your URL

`Loss`:

http://production-api.globalforestwatch.org/v1/true-color-tiles/loss/{level}/{col}/{row}

`GLAD`:

http://production-api.globalforestwatch.org/v1/true-color-tiles/glad/{level}/{col}/{row}

#### Include query parameters if you want to filter the loss data

Append them to the end of the loss URL like so:
http://production-api.globalforestwatch.org/v1/true-color-tiles/loss/{level}/{col}/{row}?thresh=75&startYear=2005&endYear=2008

The above (appending ?thresh=75&startYear=2005&endYear=2008 to the loss URL) will return only data from 2005 - 2008 (inclusive) with thresh >75, just like on the flagship website.

I'm happy to add filtering options to GLAD as well-- let me know if this is of interest.


#### Add to ArcGIS Online

Go to `Add` --> `Layer From Web`, select `A Tile Layer` from the dropdown and enter one of the URL templates above.

![Step1](images/step1.png)


#### Save webmap

Save map, then browse to it (ArcGIS menu  --> `Content`).

![Step2](images/step2.png)

#### Download the pkinfo file to view in ArcMap

On the `Content` page, click on the name of the map to download. Then click the `Open in ArcGIS Desktop` link.

![Step3](images/step3.png)

This should download an item.pkinfo XML file that looks like this:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<pkinfo>
	<ID>3ab9c7bf350744feb5e216032b2edcc5</ID>
	<size>-1</size>
	<created>1506767350000</created>
	<type>Web Map</type>
	<packagelocation>http://www.arcgisonline.com/sharing/content/items/3ab9c7bf350744feb5e216032b2edcc5/data</packagelocation>
	<pkinfolocation>http://www.arcgisonline.com/sharing/content/items/3ab9c7bf350744feb5e216032b2edcc5/item.pkinfo</pkinfolocation>
</pkinfo>
```

#### Double click the .pkinfo file to open in ArcMap

![Step4](images/step4.png)

#### Notes

Given the WGS84 --> Web Mercator projection, these tiles are not recommended for zoom levels > than 12. In short, if you need to see individual pixels, use the Hansen tiles themselves.

One unexpected bonus of Arc is that even though we don't have tiles at zoom levels > 12,  it will extrapolate these tiles. This let's us see the Hansen data at any zoom level in Arc. Cool!

#### Future development

Happy to add Terra I to this as well, and to add date filtering to GLAD as well. Let me know if this is of interest.
