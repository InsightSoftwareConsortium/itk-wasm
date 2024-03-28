import test from 'ava'
import path from 'path'
import glob from 'glob'
import fs from 'fs-extra'

import { IntTypes, PixelTypes, getMatrixElement } from 'itk-wasm'
import { readImageDicomFileSeriesNode, readDicomTagsNode, imageSetsNormalizationNode } from '../../dist/index-node.js'

const testDataInputDirectory = path.resolve('..', 'test', 'data', 'input')
const testSeriesDirectory = path.resolve(testDataInputDirectory, 'DicomImageOrientationTest')
const testDicomSeriesFiles = glob.sync(`${testSeriesDirectory}/*.dcm`)

function arrayEquals(a, b) {
  return (a.length === b.length && a.every((val, idx) => val === b[idx]))
}

function verifyImage (t, image, expectedComponentType, expectedPixelType) {
  let componentType = IntTypes.Int16
  if (expectedComponentType) {
    componentType = expectedComponentType
  }
  let pixelType = PixelTypes.Scalar
  if (expectedPixelType) {
    pixelType = expectedPixelType
  }
  t.is(image.imageType.dimension, 3, 'dimension')
  t.is(image.imageType.componentType, componentType, 'componentType')
  t.is(image.imageType.pixelType, pixelType, 'pixelType')
  t.is(image.imageType.components, 1, 'components')
  t.is(image.origin[0], -17.3551, 'origin[0]')
  t.is(image.origin[1], -133.9286, 'origin[1]')
  t.is(image.origin[2], 116.7857, 'origin[2]')
  t.is(image.spacing[0], 1.0, 'spacing[0]')
  t.is(image.spacing[1], 1.0, 'spacing[1]')
  t.is(image.spacing[2], 1.3000000000000007, 'spacing[2]')
  t.is(getMatrixElement(image.direction, 3, 0, 0), 0.0, 'direction (0, 0)')
  t.is(getMatrixElement(image.direction, 3, 0, 1), 0.0, 'direction (0, 1)')
  t.is(getMatrixElement(image.direction, 3, 0, 2), -1.0, 'direction (0, 2)')
  t.is(getMatrixElement(image.direction, 3, 1, 0), 1.0, 'direction (1, 0)')
  t.is(getMatrixElement(image.direction, 3, 1, 1), 0.0, 'direction (1, 1)')
  t.is(getMatrixElement(image.direction, 3, 1, 2), 0.0, 'direction (1, 2)')
  t.is(getMatrixElement(image.direction, 3, 2, 0), 0.0, 'direction (2, 0)')
  t.is(getMatrixElement(image.direction, 3, 2, 1), -1.0, 'direction (2, 1)')
  t.is(getMatrixElement(image.direction, 3, 2, 2), 0.0, 'direction (2, 2)')
  t.is(image.size[0], 256, 'size[0]')
  t.is(image.size[1], 256, 'size[1]')
  t.is(image.size[2], 3, 'size[2]')
  t.is(image.data.length, 3 * 65536, 'data.length')
  t.is(image.data[1000], 5, 'data[1000]')
}

test('Test reading a DICOM file', async t => {
  const { outputImage: image, sortedFilenames } = await readImageDicomFileSeriesNode({ inputImages: testDicomSeriesFiles })
  verifyImage(t, image)
  t.assert(sortedFilenames.length === 3)
  t.assert(sortedFilenames[0].includes('1.dcm'))
  t.assert(sortedFilenames[1].includes('2.dcm'))
  t.assert(sortedFilenames[2].includes('3.dcm'))
})

test('Test reading a DICOM file assume sorted', async t => {
  const singleSortedSeries = true
  const { outputImage: image, sortedFilenames } = await readImageDicomFileSeriesNode({ inputImages: testDicomSeriesFiles, singleSortedSeries })
  verifyImage(t, image)
  t.assert(sortedFilenames.length === 3)
  t.assert(sortedFilenames[0].includes('1.dcm'))
  t.assert(sortedFilenames[1].includes('2.dcm'))
  t.assert(sortedFilenames[2].includes('3.dcm'))
})

test('Test reading DICOM tags', async t => {
  const testFilePath = path.resolve(testDataInputDirectory, '1.3.6.1.4.1.5962.99.1.3814087073.479799962.1489872804257.100.0.dcm')
  const expected = {
    '0010|0020': 'NOID',
    '0020|0032': '-3.295510e+01\\-1.339286e+02\\1.167857e+02',
    '0020|0037': '0.00000e+00\\ 1.00000e+00\\-0.00000e+00\\-0.00000e+00\\ 0.00000e+00\\-1.00000e+00',
    // case sensitivity test
    '0008|103e': 'SAG/RF-FAST/VOL/FLIP 30 ',
    '0008|103E': 'SAG/RF-FAST/VOL/FLIP 30 '
  }
  const result = await readDicomTagsNode(testFilePath, { tagsToRead: { tags: Object.keys(expected) }})

  t.true(result.tags instanceof Array)
  const tagMap = new Map(result.tags)
  Object.keys(expected).forEach((tag) => {
    t.is(tagMap.get(tag), expected[tag], tag)
  })
})

test('Test reading all DICOM tags', async t => {
  const testFilePath = path.resolve(testDataInputDirectory, '1.3.6.1.4.1.5962.99.1.3814087073.479799962.1489872804257.100.0.dcm')
  const expected = {
    '0010|0020': 'NOID',
    '0020|0032': '-3.295510e+01\\-1.339286e+02\\1.167857e+02',
    '0020|0037': '0.00000e+00\\ 1.00000e+00\\-0.00000e+00\\-0.00000e+00\\ 0.00000e+00\\-1.00000e+00',
    '0008|103e': 'SAG/RF-FAST/VOL/FLIP 30 '
  }
  const result = await readDicomTagsNode(testFilePath)

  t.true(result.tags instanceof Array)
  const tagMap = new Map(result.tags)
  Object.keys(expected).forEach((tag) => {
    t.is(tagMap.get(tag), expected[tag], tag)
  })
  t.is(result.tags.length, 73, 'Number of tags')
})

// ------------------------------------
// Test DICOM SOP Classes
// ------------------------------------

test('DICOM SOP: Ultrasound Image Storage.', async t => {
  const inputFilePath = path.resolve(testDataInputDirectory, 'dicom-images/ultrasound.dcm')

  const { tags } = await readDicomTagsNode(inputFilePath)
  t.assert(new Map(tags).get('0008|0016') === '1.2.840.10008.5.1.4.1.1.6.1')

  const { outputImage } = await readImageDicomFileSeriesNode({ inputImages: [inputFilePath] })
  t.assert(outputImage != null)
  t.assert(outputImage.imageType.componentType === 'uint8')
  t.assert(outputImage.imageType.pixelType === 'Vector')
  t.assert(outputImage.imageType.components === 3)
  t.assert(arrayEquals(outputImage.origin, [0, 0, 0]))
  t.assert(arrayEquals(outputImage.spacing, [0.220751, 0.220751, 1]))
  t.assert(arrayEquals(outputImage.direction, [1, 0, 0, 0, 1, 0, 0, 0, 1]))
  t.assert(arrayEquals(outputImage.size, [1024, 768, 1]))
})

test('DICOM SOP: Secondary Image Storage.', async t => {
  const inputFilePath = path.resolve(testDataInputDirectory, 'dicom-images/secondary-capture.dcm')

  const { tags } = await readDicomTagsNode(inputFilePath)
  t.assert(new Map(tags).get('0008|0016') === '1.2.840.10008.5.1.4.1.1.7')

  const { outputImage } = await readImageDicomFileSeriesNode({ inputImages: [inputFilePath] })
  t.assert(outputImage != null)
  t.assert(outputImage.imageType.componentType === 'uint8')
  t.assert(outputImage.imageType.pixelType === 'Scalar')
  t.assert(outputImage.imageType.components === 1)
  t.assert(arrayEquals(outputImage.origin, [0, 0, 0]))
  t.assert(arrayEquals(outputImage.spacing, [1, 1, 1]))
  t.assert(arrayEquals(outputImage.direction, [1, 0, 0, 0, 1, 0, 0, 0, 1]))
  t.assert(arrayEquals(outputImage.size, [960, 720, 1]))
})

test('DICOM SOP: Segmentation Storage.', async t => {
  const inputFilePath = path.resolve(testDataInputDirectory, 'dicom-images/segmentation-storage.dcm')

  const { tags } = await readDicomTagsNode(inputFilePath)
  t.assert(new Map(tags).get('0008|0016') === '1.2.840.10008.5.1.4.1.1.66.4')

  const { outputImage } = await readImageDicomFileSeriesNode({ inputImages: [inputFilePath] })
  t.assert(outputImage != null)
  t.assert(outputImage.imageType.componentType === 'uint8')
  t.assert(outputImage.imageType.pixelType === 'Scalar')
  t.assert(outputImage.imageType.components === 1)
  t.assert(arrayEquals(outputImage.origin, [14.043, 101.425, -73.0513]))
  t.assert(arrayEquals(outputImage.spacing, [0.6055, 0.6055, 2]))
  t.assert(arrayEquals(outputImage.direction, [-1, 0, 0, 0, -1, 0, 0, 0, 1]))
  t.assert(arrayEquals(outputImage.size, [256, 256, 80]))
})

test('DICOM SOP: Computed Radiography.', async t => {
  const inputFilePath = path.resolve(testDataInputDirectory, 'dicom-images/computed-radiography.dcm')

  const { tags } = await readDicomTagsNode(inputFilePath)
  t.assert(new Map(tags).get('0008|0016') === '1.2.840.10008.5.1.4.1.1.1')

  const { outputImage } = await readImageDicomFileSeriesNode({ inputImages: [inputFilePath] })
  t.assert(outputImage != null)
  t.deepEqual(outputImage.imageType.componentType, 'uint16')
  t.deepEqual(outputImage.imageType.pixelType , 'Scalar')
  t.deepEqual(outputImage.imageType.components, 1)
  t.deepEqual(outputImage.origin, [0, 0, 0])
  t.deepEqual(outputImage.spacing, [0.139, 0.139, 1])
  t.deepEqual(outputImage.direction, Float64Array.from([1, 0, 0, 0, 1, 0, 0, 0, 1]))
  t.deepEqual(outputImage.size, [2366, 2194, 1])
})

test('DICOM SOP: Digital X-Ray Image.', async t => {
  const inputFilePath = path.resolve(testDataInputDirectory, 'dicom-images/digital-chest-xray.dcm')

  const { tags } = await readDicomTagsNode(inputFilePath)
  t.assert(new Map(tags).get('0008|0016') === '1.2.840.10008.5.1.4.1.1.1.1')

  const { outputImage } = await readImageDicomFileSeriesNode({ inputImages: [inputFilePath] })
  t.assert(outputImage != null)
  t.deepEqual(outputImage.imageType.componentType, 'uint16')
  t.deepEqual(outputImage.imageType.pixelType , 'Scalar')
  t.deepEqual(outputImage.imageType.components, 1)
  t.deepEqual(outputImage.origin, [0, 0, 0])
  t.deepEqual(outputImage.spacing, [0.148, 0.148, 1])
  t.deepEqual(outputImage.direction, Float64Array.from([1, 0, 0, 0, 1, 0, 0, 0, 1]))
  t.deepEqual(outputImage.size, [2656, 2330, 1])
})

test('DICOM SOP: Digital Mammography X-Ray Image Storage.', async t => {
  const inputFilePath = path.resolve(testDataInputDirectory, 'dicom-images/digital-mammography-xray.dcm')

  const { tags } = await readDicomTagsNode(inputFilePath)
  t.assert(new Map(tags).get('0008|0016') === '1.2.840.10008.5.1.4.1.1.1.2')

  const { outputImage } = await readImageDicomFileSeriesNode({ inputImages: [inputFilePath] })
  t.assert(outputImage != null)
  t.deepEqual(outputImage.imageType.componentType, 'uint16')
  t.deepEqual(outputImage.imageType.pixelType , 'Scalar')
  t.deepEqual(outputImage.imageType.components, 1)
  t.deepEqual(outputImage.origin, [0, 0, 0])
  t.deepEqual(outputImage.spacing, [0.07, 0.07, 1])
  t.deepEqual(outputImage.direction, Float64Array.from([1, 0, 0, 0, 1, 0, 0, 0, 1]))
  t.deepEqual(outputImage.size, [2560, 3328, 1])
})

test('DICOM SOP: RT Dose Storage.', async t => {
  const inputFilePath = path.resolve(testDataInputDirectory, 'dicom-images/RT-dose.dcm')

  const { tags } = await readDicomTagsNode(inputFilePath)
  t.assert(new Map(tags).get('0008|0016') === '1.2.840.10008.5.1.4.1.1.481.2')

  const { outputImage } = await readImageDicomFileSeriesNode({ inputImages: [inputFilePath] })
  t.assert(outputImage != null)
  t.deepEqual(outputImage.imageType.dimension, 3)
  t.deepEqual(outputImage.imageType.componentType, 'uint16')
  t.deepEqual(outputImage.imageType.pixelType , 'Scalar')
  t.deepEqual(outputImage.imageType.components, 1)
  t.deepEqual(outputImage.origin, [-87.4346184, -122.593791, 93.125896])
  t.deepEqual(outputImage.spacing, [1, 1, 1])
  t.deepEqual(outputImage.direction, Float64Array.from([
    1, 2.05103388e-10, -3.5609435582144703e-28,
    -2.05103388e-10, 1, -1.73617002e-18,
    -2.575419273602761e-36, -1.73617002e-18, -1
  ]))
  t.deepEqual(outputImage.size, [163, 203, 200])
})

test('DICOM SOP: Ultrasound Multi-frame Image Storage.', async t => {
  const inputFilePath = path.resolve(testDataInputDirectory, 'dicom-images/multiframe-ultrasound.dcm')

  const { tags } = await readDicomTagsNode(inputFilePath)
  t.assert(new Map(tags).get('0008|0016') === '1.2.840.10008.5.1.4.1.1.3.1')

  const { outputImage } = await readImageDicomFileSeriesNode({ inputImages: [inputFilePath] })
  t.assert(outputImage != null)
  t.deepEqual(outputImage.imageType.dimension, 3)
  t.deepEqual(outputImage.imageType.componentType, 'uint8')
  t.deepEqual(outputImage.imageType.pixelType , 'Scalar')
  t.deepEqual(outputImage.imageType.components, 1)
  t.deepEqual(outputImage.origin, [0, 0, 0])
  t.deepEqual(outputImage.spacing, [0.356, 0.356, 1])
  t.deepEqual(outputImage.direction, Float64Array.from([1, 0, 0, 0, 1, 0, 0, 0, 1]))
  t.deepEqual(outputImage.size, [352, 352, 227])
})

test('DICOM SOP: Positron Emission Tomography Image Storage.', async t => {
  const inputFilePath = path.resolve(testDataInputDirectory, 'dicom-images/PET')
  const files = fs.readdirSync(inputFilePath).map(fileName => inputFilePath + '/' + fileName)

  const { tags } = await readDicomTagsNode(files[0])
  t.assert(new Map(tags).get('0008|0016') === '1.2.840.10008.5.1.4.1.1.128')

  const { outputImage } = await readImageDicomFileSeriesNode({ inputImages: files })
  t.assert(outputImage != null)
  t.deepEqual(outputImage.imageType.dimension, 3)
  t.deepEqual(outputImage.imageType.componentType, 'float64')
  t.deepEqual(outputImage.imageType.pixelType , 'Scalar')
  t.deepEqual(outputImage.imageType.components, 1)
  t.deepEqual(outputImage.origin, [-342.402, -553.182, -676])
  t.deepEqual(outputImage.spacing, [ 4.07283, 4.07283, 3])
  t.deepEqual(outputImage.direction, Float64Array.from([1, 0, 0, 0, 1, 0, 0, 0, 1]))
  t.deepEqual(outputImage.size, [168, 168, 251])
})

test('DICOM SOP: CT Image.', async t => {
  const inputFilePath = path.resolve(testDataInputDirectory, 'dicom-images/CT')
  const files = fs.readdirSync(inputFilePath).map(fileName => inputFilePath + '/' + fileName)

  const { tags } = await readDicomTagsNode(files[0])
  t.assert(new Map(tags).get('0008|0016') === '1.2.840.10008.5.1.4.1.1.2')

  const { outputImage } = await readImageDicomFileSeriesNode({ inputImages: files })
  t.assert(outputImage != null)
  t.deepEqual(outputImage.imageType.dimension, 3)
  t.deepEqual(outputImage.imageType.componentType, 'int16')
  t.deepEqual(outputImage.imageType.pixelType , 'Scalar')
  t.deepEqual(outputImage.imageType.components, 1)
  t.deepEqual(outputImage.origin, [-511, -181, -2])
  t.deepEqual(outputImage.spacing, [2, 2, 223.66743882476638])
  t.deepEqual(outputImage.direction, Float64Array.from([1, 0, -6.123031769e-17, 6.123031769e-17, 0, 1, 0, -1, 0]))
  t.deepEqual(outputImage.size, [512, 512, 2])
})

test('DICOM SOP: MR Image.', async t => {
  const inputFilePath = path.resolve(testDataInputDirectory, 'dicom-images/MR')
  const files = fs.readdirSync(inputFilePath).map(fileName => inputFilePath + '/' + fileName)

  const { tags } = await readDicomTagsNode(files[0])
  t.assert(new Map(tags).get('0008|0016') === '1.2.840.10008.5.1.4.1.1.4')

  const { outputImage } = await readImageDicomFileSeriesNode({ inputImages: files })
  t.assert(outputImage != null)
  t.deepEqual(outputImage.imageType.dimension, 3)
  t.deepEqual(outputImage.imageType.componentType, 'uint16')
  t.deepEqual(outputImage.imageType.pixelType , 'Scalar')
  t.deepEqual(outputImage.imageType.components, 1)
  t.deepEqual(outputImage.origin, [-156.46333984047, -142.7302360186, -54.341191112995])
  t.deepEqual(outputImage.spacing, [1.0625, 1.0625, 1.399999976158])
  t.deepEqual(outputImage.direction, Float64Array.from([ 1, 2.051034e-10, 0, -2.051034e-10, 1, 0, 0, 0, 1 ]))
  t.deepEqual(outputImage.size, [320, 320, 5])
})

test('DICOM SOP: Nuclear Medicine Image.', async t => {
  const inputFilePath = path.resolve(testDataInputDirectory, 'dicom-images/nuclear-medicine.dcm')

  const { tags } = await readDicomTagsNode(inputFilePath)
  t.assert(new Map(tags).get('0008|0016') === '1.2.840.10008.5.1.4.1.1.20')

  const { outputImage } = await readImageDicomFileSeriesNode({ inputImages: [inputFilePath,] })
  t.assert(outputImage != null)
  t.deepEqual(outputImage.imageType.dimension, 3)
  t.deepEqual(outputImage.imageType.componentType, 'uint16')
  t.deepEqual(outputImage.imageType.pixelType , 'Scalar')
  t.deepEqual(outputImage.imageType.components, 1)
  t.deepEqual(outputImage.origin, [-304.64869833601, -459.38798370462, 1437.200400138])
  t.deepEqual(outputImage.spacing, [4.7951998710632, 4.7951998710632, 4.7951998710632])
  t.deepEqual(outputImage.direction, Float64Array.from([
      0.999984923263527,
      -0.00024031414620000064,
      0.005485936086894437,
      0.0003446298565238277,
      0.9998190041416027,
      -0.019022097349032426,
      -0.005480371876099911,
      0.019023701175250058,
      0.9998040129533861
  ]))
  t.deepEqual(outputImage.size, [128, 128, 69])
})

test("imageSetsNormalizationNode returns image sets", async (t) => {
  const { imageSetsMetadata } = await imageSetsNormalizationNode({
    files: testDicomSeriesFiles,
  });
  t.assert(!!imageSetsMetadata);
});
