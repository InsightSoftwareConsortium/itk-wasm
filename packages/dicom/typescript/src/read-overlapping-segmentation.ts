// Generated file. To retain edits, remove this comment.

import {
  BinaryFile,
  Image,
  JsonCompatible,
  InterfaceTypes,
  PipelineOutput,
  PipelineInput,
  runPipeline
} from 'itk-wasm'

import ReadOverlappingSegmentationOptions from './read-overlapping-segmentation-options.js'
import ReadOverlappingSegmentationResult from './read-overlapping-segmentation-result.js'

import { getPipelinesBaseUrl } from './pipelines-base-url.js'
import { getPipelineWorkerUrl } from './pipeline-worker-url.js'

import { getDefaultWebWorker } from './default-web-worker.js'

/**
 * Read DICOM segmentation objects
 *
 * @param {File | BinaryFile} dicomFile - Input DICOM file
 * @param {ReadOverlappingSegmentationOptions} options - options object
 *
 * @returns {Promise<ReadOverlappingSegmentationResult>} - result object
 */
async function readOverlappingSegmentation(
  dicomFile: File | BinaryFile,
  options: ReadOverlappingSegmentationOptions = {}
) : Promise<ReadOverlappingSegmentationResult> {

  const desiredOutputs: Array<PipelineOutput> = [
    { type: InterfaceTypes.Image },
    { type: InterfaceTypes.JsonCompatible },
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
  const segImageName = '0'
  args.push(segImageName)

  const metaInfoName = '1'
  args.push(metaInfoName)

  // Options
  args.push('--memory-io')
  if (options.mergeSegments) {
    options.mergeSegments && args.push('--merge-segments')
  }

  const pipelinePath = 'read-overlapping-segmentation'

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
    segImage: outputs[0]?.data as Image,
    metaInfo: outputs[1]?.data as JsonCompatible,
  }
  return result
}

export default readOverlappingSegmentation
