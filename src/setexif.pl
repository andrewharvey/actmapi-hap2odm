#!/usr/bin/perl -w

use lib './Image-ExifTool-Location-v0.0.4/lib/';
use warnings;
use strict;

use Getopt::Long;
use Image::ExifTool;
use Image::ExifTool::Location;

my $src;
my $dst;
my $lat;
my $lon;
my $alt;

GetOptions ("input=s"  => \$src,
            "output=s" => \$dst,
            "lat=f"    => \$lat,
            "lon=f"    => \$lon,
            "alt=f"    => \$alt);

my $exif = Image::ExifTool->new();

# Extract info from existing image
$exif->ExtractInfo($src);

# Set location
$exif->SetLocation($lat, $lon);

# Set elevation
$exif->SetElevation($alt);

# Write new image
$exif->WriteInfo($src, $dst);
