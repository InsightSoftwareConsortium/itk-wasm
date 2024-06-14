// Generated file. To retain edits, remove this comment.

import {
  Image,
  InterfaceTypes,
  PipelineOutput,
  PipelineInput,
  runPipelineNode
} from 'itk-wasm'

import ReadSegmentationNodeOptions from './read-segmentation-node-options.js'
import ReadSegmentationNodeResult from './read-segmentation-node-result.js'

import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Read DICOM segmentation objects
 *
 * @param {string} dicomFile - Input DICOM file
 * @param {ReadSegmentationNodeOptions} options - options object
 *
 * @returns {Promise<ReadSegmentationNodeResult>} - result object
 */
async function readSegmentationNode(
  dicomFile: string,
  options: ReadSegmentationNodeOptions = {}
) : Promise<ReadSegmentationNodeResult> {

  const mountDirs: Set<string> = new Set()

  const desiredOutputs: Array<PipelineOutput> = [
    { type: InterfaceTypes.Image },
  ]

  mountDirs.add(path.dirname(dicomFile as string))
  const inputs: Array<PipelineInput> = [
  ]

  const args = []
  // Inputs
  const dicomFileName = dicomFile
  args.push(dicomFileName)
  mountDirs.add(path.dirname(dicomFileName))

  // Outputs
  const outputImageName = '0'
  args.push(outputImageName)

  // Options
  args.push('--memory-io')
  if (options.mergeSegments) {
    options.mergeSegments && args.push('--merge-segments')
  }

  const pipelinePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'pipelines', 'read-segmentation')

  const {
    returnValue,
    stderr,
    outputs
  } = await runPipelineNode(pipelinePath, args, desiredOutputs, inputs, mountDirs)
  if (returnValue !== 0 && stderr !== "") {
    throw new Error(stderr)
  }

  const result = {
    outputImage: outputs[0]?.data as Image,
  }
  return result
}

export default readSegmentationNode
