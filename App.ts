import { execSync } from 'child_process'
import fs from 'fs-extra'
import * as path from 'path'

const directoryPath = './nodejs/views'
const routesFilePath = './nodejs/routes/route.js'

function replaceExtension (path: string) {
  return path.replace('.ejs', '')
}

function extractTitleFromHTML (filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const titleMatch = content.match(/<title>(.*?)<\/title>/i)
    const title = titleMatch?.[1]?.trim()
    return title || null
  } catch {
    return null
  }
}

const getFallbackTitle = (fileName: string): string => replaceExtension(fileName.split('-')
  .filter((x: string) => x.length > 0)
  .map((x: string) => x.charAt(0).toUpperCase() + x.slice(1))
  .join(' '))


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
  res.render('${replaceExtension(fileName)}', {title: '${extractTitleFromHTML(filePath) || getFallbackTitle(fileName)}'});
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
    console.info("Congratulations 🎉 Your Nodejs App's routes has been generated......")
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message)
    }
  }

})()
