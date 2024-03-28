// Generated file. To retain edits, remove this comment.

import {
  JsonCompatible,
  BinaryFile,
  InterfaceTypes,
  PipelineOutput,
  PipelineInput,
  runPipeline
} from 'itk-wasm'

import ImageSetsNormalizationOptions from './image-sets-normalization-options.js'
import ImageSetsNormalizationResult from './image-sets-normalization-result.js'

import { getPipelinesBaseUrl } from './pipelines-base-url.js'
import { getPipelineWorkerUrl } from './pipeline-worker-url.js'

import { getDefaultWebWorker } from './default-web-worker.js'

/**
 * Group DICOM files into image sets
 *
 * @param {ImageSetsNormalizationOptions} options - options object
 *
 * @returns {Promise<ImageSetsNormalizationResult>} - result object
 */
async function imageSetsNormalization(
  options: ImageSetsNormalizationOptions = { files: [] as BinaryFile[] | File[] | string[], }
) : Promise<ImageSetsNormalizationResult> {

  const desiredOutputs: Array<PipelineOutput> = [
    { type: InterfaceTypes.JsonCompatible },
  ]

  const inputs: Array<PipelineInput> = [
  ]

  const args = []
  // Inputs
  // Outputs
  const imageSetsName = '0'
  args.push(imageSetsName)

  // Options
  args.push('--memory-io')
  if (options.files) {
    if(options.files.length < 1) {
      throw new Error('"files" option must have a length > 1')
    }
    args.push('--files')

    await Promise.all(options.files.map(async (value) => {
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

  const pipelinePath = 'image-sets-normalization'

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
    imageSets: outputs[0]?.data as JsonCompatible,
  }
  return result
}

export default imageSetsNormalization
