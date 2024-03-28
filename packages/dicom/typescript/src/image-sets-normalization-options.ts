// Generated file. To retain edits, remove this comment.

import { BinaryFile, WorkerPoolFunctionOption } from 'itk-wasm'

interface ImageSetsNormalizationOptions extends WorkerPoolFunctionOption {
  /** DICOM files */
  files: string[] | File[] | BinaryFile[]

}

export default ImageSetsNormalizationOptions
