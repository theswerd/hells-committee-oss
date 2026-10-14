import { copyFile, mkdir, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = process.argv[2]
if (!source) throw new Error('Pass the absolute path of hells-committee-sprites.')
const destination = fileURLToPath(new URL('../public/art/', import.meta.url))
await mkdir(destination, { recursive: true })
const directory = resolve(source, 'exports/illustrated')
let count = 0
for (const name of await readdir(directory)) {
  if (!name.endsWith('.svg')) continue
  await copyFile(resolve(directory, name), resolve(destination, name))
  count++
}
console.log(`Refreshed ${count} vector poses. WebP previews can be refreshed from the same PNG exports.`)
