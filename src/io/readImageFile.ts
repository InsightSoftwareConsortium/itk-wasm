import createWebworkerPromise from "../core/internal/createWebworkerPromise.js"
import { readAsArrayBuffer } from 'promise-file-reader'

import Image from "../core/Image.js"

import config from '../itkConfig.js'

import ReadImageResult from "./ReadImageResult.js"

async function readImageFile(webWorker: Worker | null, file: File): Promise<ReadImageResult> {
  let worker = webWorker
  const { webworkerPromise, worker: usedWorker } = await createWebworkerPromise(
    'ImageIO',
    worker
  )
  worker = usedWorker
  const arrayBuffer = await readAsArrayBuffer(file)
  try {
    const image: Image = await webworkerPromise.postMessage(
      {
        operation: 'readImage',
        name: file.name,
        type: file.type,
        data: arrayBuffer,
        config: config
      },
      [arrayBuffer]
    )
    return { image, webWorker: worker }
  } catch (error: any) {
    throw Error(error.toString())
  }
}

export default readImageFile
