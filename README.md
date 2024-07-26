# actmapi-hap2odm
Process ACTmapi HAP Imagery with OpenDroneMap

Install dependencies

    apt install -y nodejs yarnpkg jq poppler-utils parallel gdal-bin pipx wget libimage-exiftool-perl
    pipx install esridump
    yarnpkg install

    wget https://cpan.metacpan.org/authors/id/A/AN/ANDYA/Image-ExifTool-Location-v0.0.4.tar.gz
    tar -xvvzf Image-ExifTool-Location-v0.0.4.tar.gz

Fetch imagery scans

    wget --recursive --no-parent https://www.actmapi.act.gov.au/hap/

Extract images from PDFs

    mkdir jpg
    parallel "mkdir -p jpg/{//}; pdfimages -j {} jpg/{.}" ::: www.actmapi.act.gov.au/hap/*/*/*.pdf

Fetch imagery footprints

    esri2geojson --paginate-oid 'https://data4.actmapi.act.gov.au/arcgis/rest/services/ACT_IMAGERY/static_historic_aerial_photo_footprints/MapServer/0' HAP_Footprints.geojson

Geotag each image based on the footprint center

    ./src/geotag.sh
