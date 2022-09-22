import {
  TextStream,
  InterfaceTypes,
  runPipeline
} from 'itk-wasm'

import StructuredReportToHtmlOptions from './StructuredReportToHtmlOptions.js'
import StructuredReportToHtmlResult from './StructuredReportToHtmlResult.js'

/**
 * Render DICOM SR file and data set to HTML/XHTML
 *
 * @param {Uint8Array} dicomFile - Input DICOM file
 *
 * @returns {Promise<StructuredReportToHtmlResult>} - result object
 */
async function structuredReportToHtml(
  webWorker: null | Worker,
  dicomFile: Uint8Array,
  options: StructuredReportToHtmlOptions = {})
    : Promise<StructuredReportToHtmlResult> {

  const desiredOutputs = [
    { type: InterfaceTypes.TextStream },
  ]
  const inputs = [
    { type: InterfaceTypes.BinaryFile, data: { data: dicomFile, path: "file0" }  },
  ]

  const args = []
  // Inputs
  args.push('file0')
  // Outputs
  args.push('0')
  // Options
  args.push('--memory-io')
  if (options.readFileOnly) {
    args.push('--read-file-only')
  }
  if (options.readDataset) {
    args.push('--read-dataset')
  }
  if (options.readXferAuto) {
    args.push('--read-xfer-auto')
  }
  if (options.readXferDetect) {
    args.push('--read-xfer-detect')
  }
  if (options.readXferLittle) {
    args.push('--read-xfer-little')
  }
  if (options.readXferBig) {
    args.push('--read-xfer-big')
  }
  if (options.readXferImplicit) {
    args.push('--read-xfer-implicit')
  }
  if (options.processingDetails) {
    args.push('--processing-details')
  }
  if (options.unknownRelationship) {
    args.push('--unknown-relationship')
  }
  if (options.invalidItemValue) {
    args.push('--invalid-item-value')
  }
  if (options.ignoreConstraints) {
    args.push('--ignore-constraints')
  }
  if (options.ignoreItemErrors) {
    args.push('--ignore-item-errors')
  }
  if (options.skipInvalidItems) {
    args.push('--skip-invalid-items')
  }
  if (options.disableVrChecker) {
    args.push('--disable-vr-checker')
  }
  if (options.charsetRequire) {
    args.push('--charset-require')
  }
  if (options.charsetAssume) {
    args.push('--charset-assume', '1')
  }
  if (options.charsetCheckAll) {
    args.push('--charset-check-all')
  }
  if (options.convertToUtf8) {
    args.push('--convert-to-utf8')
  }
  if (options.html32) {
    args.push('--html-3.2')
  }
  if (options.html40) {
    args.push('--html-4.0')
  }
  if (options.xhtml11) {
    args.push('--xhtml-1.1')
  }
  if (options.addDocumentType) {
    args.push('--add-document-type')
  }
  if (options.cssReference) {
    args.push('--css-reference', '2')
  }
  if (options.cssFile) {
    args.push('--css-file', '3')
  }
  if (options.expandInline) {
    args.push('--expand-inline')
  }
  if (options.neverExpandInline) {
    args.push('--never-expand-inline')
  }
  if (options.alwaysExpandInline) {
    args.push('--always-expand-inline')
  }
  if (options.renderFullData) {
    args.push('--render-full-data')
  }
  if (options.sectionTitleInline) {
    args.push('--section-title-inline')
  }
  if (options.documentTypeTitle) {
    args.push('--document-type-title')
  }
  if (options.patientInfoTitle) {
    args.push('--patient-info-title')
  }
  if (options.noDocumentHeader) {
    args.push('--no-document-header')
  }
  if (options.renderInlineCodes) {
    args.push('--render-inline-codes')
  }
  if (options.conceptNameCodes) {
    args.push('--concept-name-codes')
  }
  if (options.numericUnitCodes) {
    args.push('--numeric-unit-codes')
  }
  if (options.codeValueUnit) {
    args.push('--code-value-unit')
  }
  if (options.codeMeaningUnit) {
    args.push('--code-meaning-unit')
  }
  if (options.renderAllCodes) {
    args.push('--render-all-codes')
  }
  if (options.codeDetailsTooltip) {
    args.push('--code-details-tooltip')
  }

  const pipelinePath = 'structured-report-to-html'

  const {
    webWorker: usedWebWorker,
    returnValue,
    stderr,
    outputs
  } = await runPipeline(webWorker, pipelinePath, args, desiredOutputs, inputs)
  if (returnValue !== 0) {
    throw new Error(stderr)
  }

  const result = {
    webWorker: usedWebWorker as Worker,
    outputText: (outputs[0].data as TextStream).data,
  }
  return result
}

export default structuredReportToHtml
