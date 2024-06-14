// Generated file. To retain edits, remove this comment.

import {
  BinaryFile,
  Image,
  InterfaceTypes,
  PipelineOutput,
  PipelineInput,
  runPipeline
} from 'itk-wasm'

import ReadSegmentationOptions from './read-segmentation-options.js'
import ReadSegmentationResult from './read-segmentation-result.js'

import { getPipelinesBaseUrl } from './pipelines-base-url.js'
import { getPipelineWorkerUrl } from './pipeline-worker-url.js'

import { getDefaultWebWorker } from './default-web-worker.js'

/**
 * Read DICOM segmentation objects
 *
 * @param {File | BinaryFile} dicomFile - Input DICOM file
 * @param {ReadSegmentationOptions} options - options object
 *
 * @returns {Promise<ReadSegmentationResult>} - result object
 */
async function readSegmentation(
  dicomFile: File | BinaryFile,
  options: ReadSegmentationOptions = {}
) : Promise<ReadSegmentationResult> {

  const desiredOutputs: Array<PipelineOutput> = [
    { type: InterfaceTypes.Image },
  ]

  let dicomFileFile = dicomFile
  if (dicomFile instanceof File) {
    const dicomFileBuffer = await dicomFile.arrayBuffer()
    dicomFileFile = { path: dicomFile.name, data: new Uint8Array(dicomFileBuffer) }
  }
  const inputs: Array<PipelineInput> = [
    { type: InterfaceTypes.BinaryFile, data: dicomFileFile as BinaryFile },
  ]

  const args = []
  // Inputs
  const dicomFileName = (dicomFileFile as BinaryFile).path
  args.push(dicomFileName)

  // Outputs
  const outputImageName = '0'
  args.push(outputImageName)

  // Options
  args.push('--memory-io')
  if (options.mergeSegments) {
    options.mergeSegments && args.push('--merge-segments')
  }

  const pipelinePath = 'read-segmentation'

  let workerToUse = options?.webWorker
  if (workerToUse === undefined) {
    workerToUse = await getDefaultWebWorker()
  }
  const {
    webWorker: usedWebWorker,
    returnValue,
    stderr,
    outputs
  } = await runPipeline(pipelinePath, args, desiredOutputs, inputs, { pipelineBaseUrl: getPipelinesBaseUrl(), pipelineWorkerUrl: getPipelineWorkerUrl(), webWorker: workerToUse, noCopy: options?.noCopy })
  if (returnValue !== 0 && stderr !== "") {
    throw new Error(stderr)
  }

  const result = {
    webWorker: usedWebWorker as Worker,
    outputImage: outputs[0]?.data as Image,
  }
  return result
}

export default readSegmentation
