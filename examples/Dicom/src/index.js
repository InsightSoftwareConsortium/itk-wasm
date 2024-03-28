import readImageDICOMFileSeries from 'itk/readImageDICOMFileSeries'
import curry from 'curry'

import setupDicomForm from './dicomForm'
import parseDicomFiles from './parseDicomFiles'

const outputFileInformation = curry(async function outputFileInformation (outputTextArea, event) {

  function replacer (key, value) {
    if (!!value && value.byteLength !== undefined) {
      return String(value.slice(0, 6)) + '...'
    }
    return value
  }

  function startChrono(message) {
    outputTextArea.textContent += `-- ${message}... `
    return start = window.performance.now()
  }

  function endChrono(start) {
    let end = window.performance.now()
    let time = end - start
    let timeStr = `${time.toFixed(2)} ms`
    outputTextArea.textContent += `${timeStr}\n`
    return time
  }

  outputTextArea.textContent = ""

  // Get files
  const dataTransfer = event.dataTransfer
  const files = event.target.files || dataTransfer.files

  // Parse DICOM metadata
  let start = startChrono(`Parsing + organising ${files.length} files using javascript`)
  const { patients, failures } = await parseDicomFiles(files, false)
  const parseTime = endChrono(start)
  console.log(`PARSE: ${parseTime}`);

  // Select DICOM series
  setupDicomForm(patients, async (serie) => {
    console.log(serie.metaData.Modality)
    console.log(serie.metaData.SeriesDescription)
    console.log(serie.metaData.TransferSyntaxUID)

    const images = Object.values(serie.images);
    const seriesFiles = images.map((image) => image.file)

    // Read image data with itk (preSorted = true)
    start = startChrono(`Parsing selected series ${seriesFiles.length} files + loading image data using itk (preSorted=true)`)
    const readItkSortedTrue = await readImageDICOMFileSeries(seriesFiles, true)
    const imageSortedTrue = readItkSortedTrue.image
    const itkTimeSortedTrue = endChrono(start)
    // outputTextArea.textContent += JSON.stringify(imageSortedTrue, replacer, 4)
    // outputTextArea.textContent += '\n'
    console.log(`ITK READ PRESORTED: ${itkTimeSortedTrue}`);

    // Read image data with itk (preSorted = false)
    start = startChrono(`Parsing selected series ${seriesFiles.length} files + loading image data using itk (preSorted=false)`)
    const readItkSortedFalse = await readImageDICOMFileSeries(seriesFiles, false)
    const imageSortedFalse = readItkSortedFalse.image
    const itkTimeSortedFalse = endChrono(start)
    // outputTextArea.textContent += JSON.stringify(imageSortedFalse, replacer, 4)
    // outputTextArea.textContent += '\n'
    console.log(`ITK SORT + READ: ${itkTimeSortedFalse}`);

    // Read image data with javascript code
    start = startChrono("Loading image data using javascript")
    const imageDicomParser = serie.getImageData()
    const dicomParserTime = endChrono(start)
    // outputTextArea.textContent += JSON.stringify(imageDicomParser, replacer, 4)
    // outputTextArea.textContent += '\n'
    console.log(`DICOMPARSER READ: ${dicomParserTime}`);

    // Images compare
    function arraysMatch(arr1, arr2) {
      if (arr1.length !== arr2.length) {
        outputTextArea.textContent += `⚠️ Mismatch in length (${arr1.length} vs ${arr2.length}) for `
        return false;
      }
      for (let i = 0; i < arr1.length; i += 1) {
        if (arr1[i] !== arr2[i]) {
          outputTextArea.textContent += `⚠️ Values don't match (${arr1[i]} vs ${arr2[i]}) at index ${i} in `
          return false;
        }
      }
      return true;
    }
    function objectsMatch(a, b) {
      const aProps = Object.getOwnPropertyNames(a);
      const bProps = Object.getOwnPropertyNames(b);
      if (aProps.length !== bProps.length) {
        outputTextArea.textContent += `⚠️ Mismatch in number of properties (${aProps.length} vs ${aProps.length})\n`
        return false;
      }
      let match = true;
      for (let i = 0; i < aProps.length; i += 1) {
        const propName = aProps[i];
        if (a[propName] instanceof Array || ArrayBuffer.isView(a[propName])) {
          if (!arraysMatch(a[propName], b[propName])) {
            outputTextArea.textContent += `"${propName}"\n`
            match = false;
          }
        } else if (a[propName] instanceof Object) {
          match = match && objectsMatch(a[propName], b[propName])
        } else if (a[propName] !== b[propName]) {
          match = false;
          outputTextArea.textContent += `⚠️ Values don't match (${a[propName]} vs ${b[propName]}) for "${propName}"\n`
        }
      }
      return match;
    }

    outputTextArea.textContent += `-- Comparing image from js code and itk's webassembly dicom reader\n`
    if (objectsMatch(imageDicomParser, imageSortedFalse)) {
      outputTextArea.textContent += `✅ Perfect match\n`
    } else {
      outputTextArea.textContent += `❌ Mismatch\n`
    }

    // Time compare
    let ratio = (itkTimeSortedTrue / (parseTime + dicomParserTime)).toFixed(2)
    outputTextArea.textContent += `⚡ javascript code was ~${ratio}x faster than itk's webassembly dicom reader (preSorted=true)\n`
    ratio = (itkTimeSortedFalse / (parseTime + dicomParserTime)).toFixed(2)
    outputTextArea.textContent += `⚡ javascript code was ~${ratio}x faster than itk's webassembly dicom reader (preSorted=false)\n`

  })
})

export { outputFileInformation }
