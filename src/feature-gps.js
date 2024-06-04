#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import { argv } from 'node:process'

import util from 'node:util'
import { execFile } from 'node:child_process'
const execFilePromise = util.promisify(execFile);

const input = argv[2]
const img_input = argv[3]
const img_output = argv[4]
const feature = JSON.parse(await readFile(input, { encoding: 'utf8' }))

// given a footprint Polygon
const ring = feature.geometry.coordinates[0]
ring.pop() // remove closing node

// find the center location and extract the altitude
const alt = Math.round(Number(feature.properties.HAGL / 3.281)) // convert from feet to meters
const lon = ring.map(c => c[0]).reduce((a, b) => a + b) / ring.length
const lat = ring.map(c => c[1]).reduce((a, b) => a + b) / ring.length

console.log(`geotag: ${lon}, ${lat}, ${alt}`)

// use setexif.pl to set the EXIF tags
const { stdout, stderr } = await execFilePromise('./src/setexif.pl', ['--input', img_input, '--output', img_output, '--lat', lat, '--lon', lon, '--alt', alt])

if (stderr) {
  console.log(stdout)
  console.error(stderr)
  exit(1)
}
