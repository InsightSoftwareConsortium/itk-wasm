import PromiseFileReader from 'promise-file-reader'
import dicomParser from 'dicom-parser'

import DICOM_TAG_DICT from './dicomTags'

function concatenate(resultConstructor, arrays) {
  const totalLength = arrays.reduce((total, arr) => {
    return total + arr.length
  }, 0);
  const result = new resultConstructor(totalLength);
  arrays.reduce((offset, arr) => {
    result.set(arr, offset);
    return offset + arr.length;
  }, 0);
  return result;
}

class DICOMEntity {
  constructor() {
    this.metaData = {}
  }

  extractTags(metaData) {
    this.constructor.tags.forEach((tag) => {
      if (tag in metaData) {
        this.metaData[tag] = metaData[tag]
      }
    })
  }
}

class DICOMPatient extends DICOMEntity {
  static get primaryTag() {
    return 'PatientID'
  }

  static get tags() {
    return [
      'PatientID',
      'PatientName',
      'PatientBirthDate',
      'PatientSex',
      ]
    }

  constructor(metaData, file) {
    super()
    this.studies = {}
    this.extractTags(metaData)
    this.addMetaData(metaData, file)
  }

  addMetaData(metaData, file) {
    const studyId = metaData[DICOMStudy.primaryTag]
    let study = this.studies[studyId]
    if (study === undefined) {
      study = new DICOMStudy(metaData, file)
      this.studies[studyId] = study
    } else {
      study.addMetaData(metaData, file)
    }
  }
}

class DICOMStudy extends DICOMEntity {
  static get primaryTag() {
    return 'StudyInstanceUID'
  }

  static get tags() {
    return [
      'StudyID',
      'StudyInstanceUID',
      'StudyDate',
      'StudyTime',
      'AccessionNumber',
      'StudyDescription',
      ]
    }

  constructor(metaData, file) {
    super()
    this.series = {}
    this.extractTags(metaData)
    this.addMetaData(metaData, file)
  }

  addMetaData(metaData, file) {
    const serieNumber = metaData[DICOMSeries.primaryTag]
    let serie = this.series[serieNumber]
    if (serie === undefined) {
      serie = new DICOMSeries(metaData, file)
      this.series[serieNumber] = serie
    } else {
      serie.addMetaData(metaData, file)
    }
  }
}

class DICOMSeries extends DICOMEntity {
  static get primaryTag() {
    return 'SeriesInstanceUID'
  }

  static get tags() {
    return [
      'SeriesNumber',
      'SeriesInstanceUID',
      'SeriesDate',
      'SeriesTime',
      'Modality',
      'SeriesDescription',
      'ProtocolName',
      'FrameOfReferenceUID',
      'TransferSyntaxUID',
      ]
    }

  constructor(metaData, file) {
    super()
    this.images = {}
    this.extractTags(metaData)
    this.addMetaData(metaData, file)
  }

  addMetaData(metaData, file) {
    const imageNumber = metaData[DICOMImage.primaryTag]
    if (imageNumber in this.images) {
      const id = metaData[DICOMSeries.primaryTag]
      throw Error(`Image ${imageNumber} already added to serie ${id}.`)
    }
    this.images[imageNumber] = new DICOMImage(metaData, file)
  }

  getImageData() {
    function numArrayFromString(str, separator = '\\') {
      const strArray = str.split(separator)
      return strArray.map(Number)
    }

    const slices = Object.values(this.images)
    const meta = slices[0].metaData

    // Origin
    let origin = [0, 0, 0]
    if (meta.ImagePositionPatient !== undefined) {
      origin = numArrayFromString(meta.ImagePositionPatient)
    }

    // Spacing
    let spacing = [1, 1];
    if (meta.PixelSpacing !== undefined) {
      spacing = numArrayFromString(meta.PixelSpacing);
    }
    if (meta.SliceThickness !== undefined) {
      spacing.push(Number(meta.SliceThickness))
    } else {
      spacing.push(1);
    }

    // Dimensions
    const size = [
      meta.Columns,
      meta.Rows,
      Object.keys(this.images).length,
    ]

    // Direction matrix (3x3)
    let directionCosines = [1, 0, 0, 0, 1, 0]
    if (meta.ImageOrientationPatient !== undefined) {
      directionCosines = numArrayFromString(meta.ImageOrientationPatient)
    }
    const iDirCos = directionCosines.slice(0, 3)
    const jDirCos = directionCosines.slice(3, 6)
    const kDirCos = [
      iDirCos[1] * jDirCos[2] - iDirCos[2] * jDirCos[1],
      iDirCos[2] * jDirCos[0] - iDirCos[0] * jDirCos[2],
      iDirCos[0] * jDirCos[1] - iDirCos[1] * jDirCos[0],
    ]
    const direction = {
      rows: 3,
      columns: 3,
      data: [
        iDirCos[0], jDirCos[0], kDirCos[0],
        iDirCos[1], jDirCos[1], kDirCos[1],
        iDirCos[2], jDirCos[2], kDirCos[2],
      ],
    }

    // Pixel data type
    let slope = 1
    if (meta.RescaleSlope !== undefined) {
      slope = Number(meta.RescaleSlope)
    }
    let intercept = 0
    if (meta.RescaleIntercept !== undefined) {
      intercept = Number(meta.RescaleIntercept)
    }
    let smallestValue = 0
    if (meta.SmallestImagePixelValue !== undefined) {
      smallestValue = Number(meta.SmallestImagePixelValue)
    }
    const hasNegativeValues = (slope < 0) || (smallestValue + intercept) < 0;
    const unsigned = meta.PixelRepresentation === 0 && !hasNegativeValues;
    const bits = meta.BitsAllocated
    let ArrayType
    let intType
    switch (bits) {
      case 8:
        ArrayType = unsigned ? Uint8Array : Int8Array
        intType = unsigned ? 'uint8_t' : 'int8_t'
        break
      case 16:
        ArrayType = unsigned ? Uint16Array : Int16Array
        intType = unsigned ? 'uint16_t' : 'int16_t'
        break
      case 32:
        ArrayType = unsigned ? Uint32Array : Int32Array
        intType = unsigned ? 'uint32_t' : 'int32_t'
        break
      default:
        throw Error(`Unknown pixel bit type (${bits})`)
    }

    // Image info
    const imageType = {
      dimension: 3,
      componentType: intType,
      pixelType: 1, // TODO: based on meta.PhotometricInterpretation?
      components: meta.SamplesPerPixel,
    }

    // Dataview on pixel data
    const pixelDataArrays = slices.map((image) => {
      const value = image.metaData.PixelData
      return new ArrayType(value.buffer, value.offset)
    })

    // Concatenate all pixel data
    const data = concatenate(ArrayType, pixelDataArrays)

    // Rescale
    const b = Number(meta.RescaleIntercept)
    const m = Number(meta.RescaleSlope)
    const hasIntercept = !Number.isNaN(b) && b !== 0
    const hasSlope = !Number.isNaN(m) && m !== 1
    if (hasIntercept || hasSlope) {
      for (let i = 0; i < data.length; i++) {
        data[i] = m * data[i] + b
      }
    }

    return {
      imageType,
      name: "Image",
      origin,
      spacing,
      direction,
      size,
      data,
    }
  }
}

class DICOMImage extends DICOMEntity {
  static get primaryTag() {
    return 'InstanceNumber'
  }

  static get tags() {
    return [
      'InstanceNumber',
      'SOPInstanceUID',
      'PatientPosition',
      'PatientOrientation',
      'ImagePositionPatient',
      'ImageOrientationPatient',
      'PixelSpacing',
      'SliceThickness',
      'SliceLocation',
      'SamplesPerPixel',
      'PlanarConfiguration',
      'PhotometricInterpretation',
      'Rows',
      'Columns',
      'BitsAllocated',
      'BitsStored',
      'HighBit',
      'PixelRepresentation',
      'PixelData',
      'RescaleIntercept',
      'RescaleSlope',
      ]
    }

  constructor(metaData, file) {
    super()
    this.file = file
    this.extractTags(metaData)
  }
}

const allTagNames = Object.values(DICOM_TAG_DICT).map((tag) => tag.name)
function checkTagsValidity(klass) {
  const name = klass.name
  const tags = klass.tags
  const primaryTag = klass.primaryTag
  if (!tags.includes(primaryTag)) {
    throw Error(`The primary tag of the ${name} class ("${primaryTag}") is not included in its list of tags ([${tags}]).`)
  }
  tags.forEach((tag) => {
    if (!allTagNames.includes(tag)) {
      throw Error(`The tag "${tag}" associated with the ${name} class is not defined in DICOM_DICTIONARY.`)
    }
  })
}
checkTagsValidity(DICOMPatient)
checkTagsValidity(DICOMStudy)
checkTagsValidity(DICOMSeries)
checkTagsValidity(DICOMImage)

class ParseDicomError extends Error {
  constructor(failures) {
    const message =
      `Failed at parsing ${failures.length} DICOM file(s). ` +
      `Find the list of files and associated errors in the ` +
      `"failures" property of the thrown error, or ignore the ` +
      `errors by calling "parseDicomFiles(fileList, true)".`
    super(message)
    this.failures = failures
  }
}

async function parseDicomFiles(fileList, ignoreFailedFiles = false) {
  const patients = {}
  const failures = []

  async function parseFile(file) {
    // Read
    const arrayBuffer = await PromiseFileReader.readAsArrayBuffer(file)

    // Parse
    const byteArray = new Uint8Array(arrayBuffer)
    const dataSet = dicomParser.parseDicom(byteArray)

    // Read metadata (recursive)
    function readTags(dataSet) {
      const metaData = {}

      for (const tag in dataSet.elements) {
        const tagGroup = tag.substring(1,5)
        const tagElement = tag.substring(5,9)
        const tagKey = ("("+tagGroup+","+tagElement+")").toUpperCase();
        const tagInfo = DICOM_TAG_DICT[tagKey];
        const tagName = (tagInfo === undefined) ? tagKey : tagInfo.name
        const element = dataSet.elements[tag]

        if (element.items) {
          metaData[tagName] = []
          for (let j = 0; j < element.items.length; j++) {
            const innerDataSet = element.items[j].dataSet
            const innerMetaData = readTags(innerDataSet)
            metaData[tagName].push(innerMetaData)
          }
          continue
        }

        let value = undefined

        if (tagName === 'PixelData') {
          if (element.fragments) {
            throw new Error('Fragments/encapsulated pixel data is not supported.');
          } else {
            value = {
              buffer: dataSet.byteArray.buffer,
              offset: element.dataOffset,
              length: element.length,
            }
          }
        } else {
          let vr = element.vr
          if (vr === undefined) {
            if (tagInfo === undefined || tagInfo.vr === undefined) {
              console.warn(`${tagName} vr is unknown, skipping`)
            } else {
              vr = tagInfo.vr
            }
          }

          switch (vr) {
            case 'US':
              value = dataSet.uint16(tag)
              break
            case 'SS':
              value = dataSet.int16(tag)
              break
            case 'UL':
              value = dataSet.uint32(tag)
              break
            case 'US':
              value = dataSet.int32(tag)
              break
            case 'FD':
              value = dataSet.double(tag)
              break
            case 'FL':
              value = dataSet.float(tag)
              break
            case 'AT':
              value = `(${dataSet.uint16(tag, 0)},${dataSet.uint16(tag, 1)})`
              break
            case 'OB':
            case 'OW':
            case 'UN':
            case 'OF':
            case 'UT':
              // TODO: binary data? is this correct?
              if (element.length === 2) {
                value = dataSet.uint16(tag)
              } else if (element.length === 4) {
                value = dataSet.uint32(tag)
              } else {
                continue
              }
              break
            default: //string
              value = dataSet.string(tag)
              break
          }
        }

        metaData[tagName] = value
      }

      return metaData
    }
    const metaData = readTags(dataSet)

    // Organize metadata
    const patientId = metaData[DICOMPatient.primaryTag]
    let patient = patients[patientId]
    if (patient === undefined) {
      patient = new DICOMPatient(metaData, file)
      patients[patientId] = patient
    } else {
      patient.addMetaData(metaData, file)
    }
  }

  // Set up promises
  const parseFiles = [...fileList].map((file) => {
    const promise = parseFile(file)
    return promise.catch((error) => {
      failures.push({ file, error })
    })
  })

  // Parse all files and populate patients
  const logName = `Parsed ${fileList.length} DICOM files in`
  console.time(logName)
  await Promise.all(parseFiles).then(() => {
    console.log(patients)
    if (failures.length > 0) {
      console.error(failures[0].error.stack)
    }
    if (!ignoreFailedFiles && failures.length > 0) {
      throw new ParseDicomError(failures)
    }
  })
  console.timeEnd(logName)
  return { patients, failures }
}

export default parseDicomFiles