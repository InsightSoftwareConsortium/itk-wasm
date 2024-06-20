// Generated file. To retain edits, remove this comment.

import { Image, JsonCompatible, WorkerPoolFunctionResult } from 'itk-wasm'

interface ReadSegmentationResult extends WorkerPoolFunctionResult {
  /** dicom segmentation object as an image */
  segImage: Image

  /** Output overlay information */
  metaInfo: JsonCompatible

}

export default ReadSegmentationResult
