// Generated file. To retain edits, remove this comment.

import {
  Image,
  JsonCompatible,
  BinaryFile,
  InterfaceTypes,
  PipelineOutput,
  PipelineInput,
  runPipeline
} from 'itk-wasm'

import WriteOverlappingSegmentationOptions from './write-overlapping-segmentation-options.js'
import WriteOverlappingSegmentationResult from './write-overlapping-segmentation-result.js'

import { getPipelinesBaseUrl } from './pipelines-base-url.js'
import { getPipelineWorkerUrl } from './pipeline-worker-url.js'

import { getDefaultWebWorker } from './default-web-worker.js'

/**
 * Write DICOM segmentation object
 *
 * @param {Image} segImage - dicom segmentation object as an image
 * @param {JsonCompatible} metaInfo - JSON file containing the meta-information that describesthe measurements to be encoded. See DCMQI documentation for details.
 * @param {string} outputDicomFile - File name of the DICOM SEG object that will store theresult of conversion.
 * @param {WriteOverlappingSegmentationOptions} options - options object
 *
 * @returns {Promise<WriteOverlappingSegmentationResult>} - result object
 */
async function writeOverlappingSegmentation(
  segImage: Image,
  metaInfo: JsonCompatible,
  outputDicomFile: string,
  options: WriteOverlappingSegmentationOptions = { refDicomSeries: [] as BinaryFile[] | File[] | string[], }
) : Promise<WriteOverlappingSegmentationResult> {

  const desiredOutputs: Array<PipelineOutput> = [
    { type: InterfaceTypes.BinaryFile, data: { path: outputDicomFile, data: new Uint8Array() }},
  ]

  const inputs: Array<PipelineInput> = [
    { type: InterfaceTypes.Image, data: segImage },
    { type: InterfaceTypes.JsonCompatible, data: metaInfo as JsonCompatible  },
  ]

  const args = []
  // Inputs
  const segImageName = '0'
  args.push(segImageName)

  const metaInfoName = '1'
  args.push(metaInfoName)

  // Outputs
  const outputDicomFileName = outputDicomFile
  args.push(outputDicomFileName)

  // Options
  args.push('--memory-io')
  if (options.refDicomSeries) {
    if(options.refDicomSeries.length < 1) {
      throw new Error('"ref-dicom-series" option must have a length > 1')
    }
    args.push('--ref-dicom-series')

    await Promise.all(options.refDicomSeries.map(async (value) => {
      let valueFile = value
      if (value instanceof File) {
        const valueBuffer = await value.arrayBuffer()
        valueFile = { path: value.name, data: new Uint8Array(valueBuffer) }
      }
      inputs.push({ type: InterfaceTypes.BinaryFile, data: valueFile as BinaryFile })
      const name = value instanceof File ? value.name : (valueFile as BinaryFile).path
      args.push(name)
    }))
  }
  if (options.skipEmptySlices) {
    options.skipEmptySlices && args.push('--skip-empty-slices')
  }
  if (options.useLabelidAsSegmentnumber) {
    options.useLabelidAsSegmentnumber && args.push('--use-labelid-as-segmentnumber')
  }

  const pipelinePath = 'write-overlapping-segmentation'

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
    outputDicomFile: outputs[0]?.data as BinaryFile,
  }
  return result
}

export default writeOverlappingSegmentation
