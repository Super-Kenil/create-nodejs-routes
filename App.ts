import { execSync } from 'child_process'
import fs from 'fs-extra'
import * as path from 'path'

const directoryPath = './nodejs/views'
const routesFilePath = './nodejs/routes/route.js'

function replaceExtension (path: string) {
  return path.replace('.ejs', '')
}

async function processFiles (directory: string) {
  try {
    const files = await fs.readdir(directory)
    let routeFileContent = `
const express = require('express');
const route = express.Router();

`
    await fs.appendFile(routesFilePath, routeFileContent, { encoding: 'utf-8', })

    for (const file of files) {
      const filePath = path.join(directory, file)
      if (fs.statSync(filePath).isDirectory()) {
        await processFiles(filePath)
      } else {
        if (file.endsWith('.ejs')) {
          const fileName = filePath.replace('nodejs/views/', '')
          const singleRouteContent = `
route.get('${replaceExtension(fileName)}', (req, res, next) => {
  res.render('${replaceExtension(fileName)}', {title: '${replaceExtension(fileName.split('-').filter((x) => x.length > 0).map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' '))}'});
})
`
          await fs.appendFile(routesFilePath, singleRouteContent, { encoding: 'utf-8', })
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message)
    }
  }
}

(async function copy () {

  try {
    fs.copySync('HTML', 'nodejs',)
    execSync('find ./nodejs -type f -name "*.html" -exec sh -c \'mv "$1" "${1%.html}.ejs"\' _ {} \\;')
    execSync('find ./nodejs -type f -name "*.ejs" -exec sh -c \'mkdir -p nodejs/views && mv {} nodejs/views/\' \\;')
    execSync('find -exec sh -c \'mkdir -p nodejs/routes && touch nodejs/routes/route.js\' \\;')

    await processFiles(directoryPath)
    console.info('Congratulations 🎉 Your routes file is now created')
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message)
    }
  }

})()
