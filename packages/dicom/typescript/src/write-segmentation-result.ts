// Generated file. To retain edits, remove this comment.

import { BinaryFile, WorkerPoolFunctionResult } from 'itk-wasm'

interface WriteSegmentationResult extends WorkerPoolFunctionResult {
  /** File name of the DICOM SEG object that will store theresult of conversion. */
  outputDicomFile: BinaryFile

}

export default WriteSegmentationResult
