// Generated file. To retain edits, remove this comment.

import {
  Image,
  JsonCompatible,
  InterfaceTypes,
  PipelineOutput,
  PipelineInput,
  runPipelineNode
} from 'itk-wasm'

import ReadOverlappingSegmentationNodeOptions from './read-overlapping-segmentation-node-options.js'
import ReadOverlappingSegmentationNodeResult from './read-overlapping-segmentation-node-result.js'

import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Read DICOM segmentation objects
 *
 * @param {string} dicomFile - Input DICOM file
 * @param {ReadOverlappingSegmentationNodeOptions} options - options object
 *
 * @returns {Promise<ReadOverlappingSegmentationNodeResult>} - result object
 */
async function readOverlappingSegmentationNode(
  dicomFile: string,
  options: ReadOverlappingSegmentationNodeOptions = {}
) : Promise<ReadOverlappingSegmentationNodeResult> {

  const mountDirs: Set<string> = new Set()

  const desiredOutputs: Array<PipelineOutput> = [
    { type: InterfaceTypes.Image },
    { type: InterfaceTypes.JsonCompatible },
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
  const segImageName = '0'
  args.push(segImageName)

  const metaInfoName = '1'
  args.push(metaInfoName)

  // Options
  args.push('--memory-io')
  if (options.mergeSegments) {
    options.mergeSegments && args.push('--merge-segments')
  }

  const pipelinePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'pipelines', 'read-overlapping-segmentation')

  const {
    returnValue,
    stderr,
    outputs
  } = await runPipelineNode(pipelinePath, args, desiredOutputs, inputs, mountDirs)
  if (returnValue !== 0 && stderr !== "") {
    throw new Error(stderr)
  }

  const result = {
    segImage: outputs[0]?.data as Image,
    metaInfo: outputs[1]?.data as JsonCompatible,
  }
  return result
}

export default readOverlappingSegmentationNode
