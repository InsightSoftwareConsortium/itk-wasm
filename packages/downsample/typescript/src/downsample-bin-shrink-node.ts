// Generated file. To retain edits, remove this comment.

import {
  Image,
  InterfaceTypes,
  PipelineOutput,
  PipelineInput,
  runPipelineNode
} from 'itk-wasm'

import DownsampleBinShrinkNodeOptions from './downsample-bin-shrink-node-options.js'
import DownsampleBinShrinkNodeResult from './downsample-bin-shrink-node-result.js'

import path from 'path'

/**
 * Apply local averaging and subsample the input image.
 *
 * @param {Image} input - Input image
 * @param {DownsampleBinShrinkNodeOptions} options - options object
 *
 * @returns {Promise<DownsampleBinShrinkNodeResult>} - result object
 */
async function downsampleBinShrinkNode(
  input: Image,
  options: DownsampleBinShrinkNodeOptions = { shrinkFactors: [] as number[], }
) : Promise<DownsampleBinShrinkNodeResult> {

  const desiredOutputs: Array<PipelineOutput> = [
    { type: InterfaceTypes.Image },
  ]

  const inputs: Array<PipelineInput> = [
    { type: InterfaceTypes.Image, data: input },
  ]

  const args = []
  // Inputs
  const inputName = '0'
  args.push(inputName)

  // Outputs
  const downsampledName = '0'
  args.push(downsampledName)

  // Options
  args.push('--memory-io')
  if (typeof options.shrinkFactors !== "undefined") {
    if(options.shrinkFactors.length < 2) {
      throw new Error('"shrink-factors" option must have a length > 2')
    }
    args.push('--shrink-factors')

    options.shrinkFactors.forEach((value) => {
      args.push(value.toString())

    })
  }
  if (typeof options.informationOnly !== "undefined") {
    options.informationOnly && args.push('--information-only')
  }

  const pipelinePath = path.join(path.dirname(import.meta.url.substring(7)), 'pipelines', 'downsample-bin-shrink')

  const {
    returnValue,
    stderr,
    outputs
  } = await runPipelineNode(pipelinePath, args, desiredOutputs, inputs)
  if (returnValue !== 0 && stderr !== "") {
    throw new Error(stderr)
  }

  const result = {
    downsampled: outputs[0]?.data as Image,
  }
  return result
}

export default downsampleBinShrinkNode