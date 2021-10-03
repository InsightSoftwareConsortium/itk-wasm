import fs from 'fs'
import path from 'path'
import mime from 'mime-types'

import mimeToIO from './internal/MimeToImageIO.js'
import getFileExtension from './getFileExtension.js'
import extensionToIO from './internal/extensionToImageIO.js'
import ImageIOIndex from './internal/ImageIOIndex.js'

import Image from '../core/Image.js'

import loadEmscriptenModule from '../core/internal/loadEmscriptenModuleNode.js'
import readImageEmscriptenFSFile from './internal/readImageEmscriptenFSFile.js'
import ImageIOBaseEmscriptenModule from './internal/ImageIOBaseEmscriptenModule.js'
import localPathRelativeToModule from './localPathRelativeToModule.js'

/**
 * Read an image from a file on the local filesystem in Node.js.
 *
 * @param: filePath path to the file on the local filesystem.
 */
async function readImageLocalFile(filePath: string): Promise<Image> {
  const imageIOsPath = localPathRelativeToModule(import.meta.url, '../image-io')
  if (!fs.existsSync(imageIOsPath)) {
    throw Error("Cannot find path to itk image IO's")
  }
  const absoluteFilePath = path.resolve(filePath)
  const mimeType = mime.lookup(absoluteFilePath)
  const extension = getFileExtension(absoluteFilePath)

  let io = null
  if (mimeType && mimeToIO.has(mimeType)) {
    io = mimeToIO.get(mimeType)
  } else if (extensionToIO.has(extension)) {
    io = extensionToIO.get(extension)
  } else {
    for (let idx = 0; idx < ImageIOIndex.length; ++idx) {
      const modulePath = path.join(imageIOsPath, ImageIOIndex[idx] + 'Wasm.js')
      const Module = await loadEmscriptenModule(modulePath, imageIOsPath) as ImageIOBaseEmscriptenModule
      const imageIO = new Module.ITKImageIO()
      const mountedFilePath = Module.mountContainingDirectory(absoluteFilePath)
      imageIO.SetFileName(mountedFilePath)
      if (imageIO.CanReadFile(mountedFilePath)) {
        io = ImageIOIndex[idx]
        Module.unmountContainingDirectory(mountedFilePath)
        break
      }
      Module.unmountContainingDirectory(mountedFilePath)
    }
  }
  if (io === null) {
    throw Error('Could not find IO for: ' + absoluteFilePath)
  }

  const modulePath = path.join(imageIOsPath, io as string + 'Wasm.js')
  console.log(modulePath)
  const Module = await loadEmscriptenModule(modulePath, imageIOsPath) as ImageIOBaseEmscriptenModule
  console.log(Module)
  const mountedFilePath = Module.mountContainingDirectory(absoluteFilePath)
  const image = readImageEmscriptenFSFile(Module, mountedFilePath)
  Module.unmountContainingDirectory(mountedFilePath)
  return image
}

export default readImageLocalFile
