#!/usr/bin/env node

import { readdir, readFile, appendFile, lstat, mkdir } from 'node:fs/promises'
import { exit } from 'node:process'
import { join } from 'node:path'
import pLimit from 'p-limit'

import util from 'node:util'
import { execFile } from 'node:child_process'
const execFilePromise = util.promisify(execFile);

const limit = pLimit(16)
const tasks = []

const footprintsInfoFile = 'HAP_Footprints.info.json'
const photosRoot = 'jpg/www.actmapi.act.gov.au/hap'

// index info features by CATURE/RUN/PHOTO
console.log(`Indexing ${footprintsInfoFile}...`)
const info = JSON.parse(await readFile(footprintsInfoFile, { encoding: 'utf8' }))
const features = {}
for (const feature of info.layers[0].features) {
  const id = [feature.properties?.CAPTURE, feature.properties?.RUN, feature.properties?.PHOTO].join('/')
  features[id] = feature
}

// now go through each photo file
const years = (await readdir(photosRoot)).filter(async fileName => (await lstat(join(photosRoot, fileName))).isDirectory())

console.log(years)

for (const year of years) {
  const runs = (await readdir(join(photosRoot, year))).filter(async fileName => (await lstat(join(photosRoot, year, fileName))).isDirectory())

  for (const run of runs) {
    const photos = (await readdir(join(photosRoot, year, run))).filter(async fileName => (await lstat(join(photosRoot, year, run, fileName))).isFile() && fileName.endsWith('.jpg'))

    for (const photoFile of photos) {
      const photo = photoFile.split('-')[0]

      const id = [year, run, photo].join('/')
      if (id in features) {
        const feature = features[id]

        if (!feature?.geometry?.coordinates || !feature.geometry.coordinates.length) {
          console.log(`No footprint polygon for ${id}`)
          await appendFile('feature-gps.missing-footprint.log', `${id}\n`);
        } else {

          // given a footprint Polygon
          const ring = feature.geometry.coordinates[0]
          ring.pop() // remove closing node

          // find the center location and extract the altitude
          const alt = Math.round(Number(feature.properties.HAGL / 3.281)) // convert from feet to meters
          const lon = ring.map(c => c[0]).reduce((a, b) => a + b) / ring.length
          const lat = ring.map(c => c[1]).reduce((a, b) => a + b) / ring.length

          console.log(`${id}: ${lon}, ${lat}, ${alt}`)

          const img_input = join(photosRoot, year, run, photoFile)
          const img_output = join('geotagged', year, run, `${photo}.jpg`)
          await mkdir(join('geotagged', year, run), { recursive: true })

          const index = tasks.length
          // use setexif.pl to set the EXIF tags
          tasks.push(limit(async () => {
            const { stdout, stderr } = await execFilePromise('./src/setexif.pl', ['--input', img_input, '--output', img_output, '--lat', lat, '--lon', lon, '--alt', alt])

            process.stdout.write(`${index}\r`)

            if (stderr) {
              console.log(stdout)
              console.error(stderr)
              await appendFile('geotag.setexif-error.log', `${id}\n`);
            }
          }))
        }
      } else {
        console.log(`No footprint feature for ${id}`)
        await appendFile('geotag.missing-footprint.log', `${id}\n`);
      }
    }
  }
}

console.log(`${tasks.length} tasks`)
await Promise.all(tasks)

process.stdout.write('\n')
