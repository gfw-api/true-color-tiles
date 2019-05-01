# True Color Tiles Microservice

This repository moves the dynamic pixel showing/hiding/recoloring magic from the GFW flagship site to the server-side, making true color loss and GLAD tiles more easily available.

To demo this service, try adding the following to the map on http://geojson.io (Meta -> Add Map Layer):
http://production-api.globalforestwatch.org/v1/true-color-tiles/loss/{z}/{x}/{y}?thresh=75&startYear=2005&endYear=2008

The above will add loss tiles to the geojson.io map, filtering to show only data from 2005 - 2008 where thresh >=75.

This is the same mechanism that the flagship performs when users change the timeline and the TCD threshold of interest.

For an example of adding zoomable loss/glad tiles to ArcMap, see [Add-Data-to-ArcMap.md](Add-Data-to-ArcMap.md)

## Endpoints

### Annual Loss Layer
http://production-api.globalforestwatch.org/v1/true-color-tiles/loss/{z}/{x}/{y}

Query Parameters

| Parameter | Type | Description | 
|-----------|------|-------------|
|thresh| Int | Tree cover Density Threshold used to mask Tree cover loss (10/15/20/25/30/50/75 - default 30) |
|startYear | Int | Will filter out all loss prior to given year (default 2000) |
|endYear | Int | Will filter out all loss after given year (default 2018) |


### GLAD alerts
http://production-api.globalforestwatch.org/v1/true-color-tiles/glad/{z}/{x}/{y}

| Parameter | Type | Description | 
|-----------|------|-------------|
|startDate | Date | Will filter out all alerts prior to given date. Use format YYYY-MM-DD (default 2015-01-01) |
|endYear | Int | Will filter out all alerts after given date. Use format YYYY-MM-DD (default today) |
|showUnconfirmed | Bool | Show unconfirmed alerts (default False) |

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
