// Generated file. To retain edits, remove this comment.

import { Image } from 'itk-wasm'

interface CompareDoubleImagesNodeOptions {
  /** Baseline images to compare against */
  baselineImages: Image[]

  /** Intensity difference for pixels to be considered different. */
  differenceThreshold?: number

  /** Radius of the neighborhood around a pixel to search for similar intensity values. */
  radiusTolerance?: number

  /** Number of pixels that can be different before the test fails. */
  numberOfPixelsTolerance?: number

  /** Ignore boundary pixels. Useful when resampling may have introduced difference pixel values along the image edge. */
  ignoreBoundaryPixels?: boolean

}

export default CompareDoubleImagesNodeOptions
