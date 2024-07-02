// Generated file. To retain edits, remove this comment.

import {
  Image,
  JsonCompatible,
  InterfaceTypes,
  PipelineOutput,
  PipelineInput,
  runPipelineNode
} from 'itk-wasm'

import WriteSegmentationNodeOptions from './write-segmentation-node-options.js'
import WriteSegmentationNodeResult from './write-segmentation-node-result.js'

import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Write DICOM segmentation object
 *
 * @param {Image} segImage - dicom segmentation object as an image
 * @param {JsonCompatible} metaInfo - JSON file containing the meta-information that describesthe measurements to be encoded. See DCMQI documentation for details.
 * @param {string} outputDicomFile - File name of the DICOM SEG object that will store theresult of conversion.
 * @param {WriteSegmentationNodeOptions} options - options object
 *
 * @returns {Promise<WriteSegmentationNodeResult>} - result object
 */
async function writeSegmentationNode(
  segImage: Image,
  metaInfo: JsonCompatible,
  outputDicomFile: string,
  options: WriteSegmentationNodeOptions = { refDicomSeries: [] as string[], }
) : Promise<WriteSegmentationNodeResult> {

  const mountDirs: Set<string> = new Set()

  const desiredOutputs: Array<PipelineOutput> = [
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
  mountDirs.add(path.dirname(outputDicomFileName))

  // Options
  args.push('--memory-io')
  if (options.refDicomSeries) {
    if(options.refDicomSeries.length < 1) {
      throw new Error('"ref-dicom-series" option must have a length > 1')
    }
    args.push('--ref-dicom-series')

    options.refDicomSeries.forEach((value) => {
      mountDirs.add(path.dirname(value as string))
      args.push(value as string)
    })
  }
  if (options.skipEmptySlices) {
    options.skipEmptySlices && args.push('--skip-empty-slices')
  }
  if (options.useLabelidAsSegmentnumber) {
    options.useLabelidAsSegmentnumber && args.push('--use-labelid-as-segmentnumber')
  }

  const pipelinePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'pipelines', 'write-segmentation')

  const {
    returnValue,
    stderr,
  } = await runPipelineNode(pipelinePath, args, desiredOutputs, inputs, mountDirs)
  if (returnValue !== 0 && stderr !== "") {
    throw new Error(stderr)
  }

  const result = {
  }
  return result
}

export default writeSegmentationNode
