// Generated file. To retain edits, remove this comment.

import {
  JsonCompatible,
  InterfaceTypes,
  PipelineOutput,
  PipelineInput,
  runPipelineNode
} from 'itk-wasm'

import ImageSetsNormalizationNodeOptions from './image-sets-normalization-node-options.js'
import ImageSetsNormalizationNodeResult from './image-sets-normalization-node-result.js'

import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Group DICOM files into image sets
 *
 * @param {ImageSetsNormalizationNodeOptions} options - options object
 *
 * @returns {Promise<ImageSetsNormalizationNodeResult>} - result object
 */
async function imageSetsNormalizationNode(
  options: ImageSetsNormalizationNodeOptions = { files: [] as string[], }
) : Promise<ImageSetsNormalizationNodeResult> {

  const mountDirs: Set<string> = new Set()

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

    options.files.forEach((value) => {
      mountDirs.add(path.dirname(value as string))
      args.push(value as string)
    })
  }

  const pipelinePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'pipelines', 'image-sets-normalization')

  const {
    returnValue,
    stderr,
    outputs
  } = await runPipelineNode(pipelinePath, args, desiredOutputs, inputs, mountDirs)
  if (returnValue !== 0 && stderr !== "") {
    throw new Error(stderr)
  }

  const result = {
    imageSets: outputs[0]?.data as JsonCompatible,
  }
  return result
}

export default imageSetsNormalizationNode
