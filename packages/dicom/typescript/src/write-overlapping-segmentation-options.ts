// Generated file. To retain edits, remove this comment.

import { BinaryFile, WorkerPoolFunctionOption } from 'itk-wasm'

interface WriteOverlappingSegmentationOptions extends WorkerPoolFunctionOption {
  /** List of DICOM files that correspond to the originalimage that was segmented. */
  refDicomSeries: string[] | File[] | BinaryFile[]

  /** Skip empty slices while encoding segmentation image.By default, empty slices will not be encoded, resulting in a smaller output file size. */
  skipEmptySlices?: boolean

  /** Use label IDs from ITK images asSegment Numbers in DICOM. Only works if label IDs are consecutively numbered starting from 1, otherwise conversion will fail. */
  useLabelidAsSegmentnumber?: boolean

}

export default WriteOverlappingSegmentationOptions
