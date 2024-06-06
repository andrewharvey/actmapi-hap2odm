#!/usr/bin/bash

set -e

# for each image
for image in jpg/*/*/*/*/*.jpg; do
    year=`echo $image | cut -d'/' -f4`
    run=`echo $image | cut -d'/' -f5`
    file=`echo $image | cut -d'/' -f6`
    photo=`echo $file | cut -d'-' -f1`

    echo "$year/$run/$photo"

    feature=`mktemp --suffix .geojson`

    # find the corresponding footprint and save it as a GeoJSON Feature
    ogrinfo -json -features -where "CAPTURE=$year AND RUN=$run AND PHOTO=$photo" HAP_Footprints.geojson | jq '.layers[0].features[0]' > $feature

    output="geotagged/$year/$run-$photo.jpg"

    mkdir -p geotagged/$year

    # geotag the JPEG from the GeoJSON Feature
    ./src/feature-gps.js $year/$run/$photo $feature $image $output

    rm -f $feature
done
