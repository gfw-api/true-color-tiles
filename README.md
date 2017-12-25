# True Color Tiles Microservice

This repository moves the dynamic pixel showing/hiding/recoloring magic from the GFW flagship site to the server-side, making true color loss and GLAD tiles more easily available.

To demo this service, try adding the following to the map on http://geojson.io (Meta -> Add Map Layer):
http://production-api.globalforestwatch.org/v1/true-color-tiles/loss/{z}/{x}/{y}?thresh=75&startYear=2005&endYear=2008

The above will add loss tiles to the geojson.io map, filtering to show only data from 2005 - 2008 where thresh >=75.

This is the same mechanism that the flagship performs when users change the timeline and the TCD threshold of interest.

For an example of adding zoomable loss/glad tiles to ArcMap, see [Add-Data-to-ArcMap.md](Add-Data-to-ArcMap.md)

### Running locally on OS X

**First, make sure that you have the [API gateway running
locally](https://github.com/control-tower/control-tower).**

We're using Docker which, luckily for you, means that getting the
application running locally should be fairly painless. First, make sure
that you have [Docker Compose](https://docs.docker.com/compose/install/)
installed on your machine.

```
git clone https://github.com/gfw-api/true-color-tiles
cd true-color-tiles
./true-color-tiles.sh develop
```
