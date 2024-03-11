// Generated file. To retain edits, remove this comment.

import { readImage } from '@itk-wasm/image-io'
import { writeImage } from '@itk-wasm/image-io'
import * as compareImages from '../../../dist/index.js'
import compareDoubleImagesLoadSampleInputs, { usePreRun } from "./compare-double-images-load-sample-inputs.js"

class CompareDoubleImagesModel {
  inputs: Map<string, any>
  options: Map<string, any>
  outputs: Map<string, any>

  constructor() {
    this.inputs = new Map()
    this.options = new Map()
    this.outputs = new Map()
    }
}


class CompareDoubleImagesController {

  constructor(loadSampleInputs) {
    this.loadSampleInputs = loadSampleInputs

    this.model = new CompareDoubleImagesModel()
    const model = this.model

    if (loadSampleInputs) {
      const loadSampleInputsButton = document.querySelector("#compareDoubleImagesInputs [name=loadSampleInputs]")
      loadSampleInputsButton.setAttribute('style', 'display: block-inline;')
      loadSampleInputsButton.addEventListener('click', async (event) => {
        loadSampleInputsButton.loading = true
        await loadSampleInputs(model)
        loadSampleInputsButton.loading = false
      })
    }

    // ----------------------------------------------
    // Inputs
    const testImageElement = document.querySelector('#compareDoubleImagesInputs input[name=test-image-file]')
    testImageElement.addEventListener('change', async (event) => {
        const dataTransfer = event.dataTransfer
        const files = event.target.files || dataTransfer.files

        const { image, webWorker } = await readImage(files[0])
        webWorker.terminate()
        model.inputs.set("testImage", image)
        const details = document.getElementById("compareDoubleImages-test-image-details")
        loadImage(image, details)
        details.disabled = false
    })

    // ----------------------------------------------
    // Options
    const baselineImagesElement = document.querySelector('#compareDoubleImagesInputs input[name=baseline-images-file]')
    baselineImagesElement.addEventListener('change', async (event) => {
        const dataTransfer = event.dataTransfer
        const files = event.target.files || dataTransfer.files

        const readImages = await Promise.all(Array.from(files).map(async (file) => readImage(file)))
        readImages.forEach(img => img.webWorker.terminate())
        const inputImages = readImages.map(img => img.image)
        model.options.set("baselineImages", inputImages)
        const details = document.getElementById("compareDoubleImages-baseline-images-details")
        details.innerHTML = `<pre>${globalThis.escapeHtml(JSON.stringify(inputImages, globalThis.interfaceTypeJsonReplacer, 2))}</pre>`
        details.disabled = false
    })

    const differenceThresholdElement = document.querySelector('#compareDoubleImagesInputs sl-input[name=difference-threshold]')
    differenceThresholdElement.addEventListener('sl-change', (event) => {
        model.options.set("differenceThreshold", parseFloat(differenceThresholdElement.value))
    })

    const radiusToleranceElement = document.querySelector('#compareDoubleImagesInputs sl-input[name=radius-tolerance]')
    radiusToleranceElement.addEventListener('sl-change', (event) => {
        model.options.set("radiusTolerance", parseInt(radiusToleranceElement.value))
    })

    const numberOfPixelsToleranceElement = document.querySelector('#compareDoubleImagesInputs sl-input[name=number-of-pixels-tolerance]')
    numberOfPixelsToleranceElement.addEventListener('sl-change', (event) => {
        model.options.set("numberOfPixelsTolerance", parseInt(numberOfPixelsToleranceElement.value))
    })

    const ignoreBoundaryPixelsElement = document.querySelector('#compareDoubleImagesInputs sl-checkbox[name=ignore-boundary-pixels]')
    ignoreBoundaryPixelsElement.addEventListener('sl-change', (event) => {
        model.options.set("ignoreBoundaryPixels", ignoreBoundaryPixelsElement.checked)
    })

    // ----------------------------------------------
    // Outputs
    const metricsOutputDownload = document.querySelector('#compareDoubleImagesOutputs sl-button[name=metrics-download]')
    metricsOutputDownload.addEventListener('click', async (event) => {
        event.preventDefault()
        event.stopPropagation()
        if (model.outputs.has("metrics")) {
            const fileName = `metrics.json`
            globalThis.downloadFile(new TextEncoder().encode(JSON.stringify(model.outputs.get("metrics"))), fileName)
        }
    })

    const differenceImageOutputDownload = document.querySelector('#compareDoubleImagesOutputs sl-button[name=difference-image-download]')
    differenceImageOutputDownload.addEventListener('click', async (event) => {
        event.preventDefault()
        event.stopPropagation()
        if (model.outputs.has("differenceImage")) {
            const differenceImageDownloadFormat = document.getElementById('compareDoubleImages-difference-image-output-format')
            const downloadFormat = differenceImageDownloadFormat.value || 'nrrd'
            const fileName = `differenceImage.${downloadFormat}`
            const { webWorker, serializedImage } = await writeImage(model.outputs.get("differenceImage"), fileName)

            webWorker.terminate()
            globalThis.downloadFile(serializedImage.data, fileName)
        }
    })

    const differenceUchar2dImageOutputDownload = document.querySelector('#compareDoubleImagesOutputs sl-button[name=difference-uchar-2d-image-download]')
    differenceUchar2dImageOutputDownload.addEventListener('click', async (event) => {
        event.preventDefault()
        event.stopPropagation()
        if (model.outputs.has("differenceUchar2dImage")) {
            const differenceUchar2dImageDownloadFormat = document.getElementById('compareDoubleImages-difference-uchar-2d-image-output-format')
            const downloadFormat = differenceUchar2dImageDownloadFormat.value || 'nrrd'
            const fileName = `differenceUchar2dImage.${downloadFormat}`
            const { webWorker, serializedImage } = await writeImage(model.outputs.get("differenceUchar2dImage"), fileName)

            webWorker.terminate()
            globalThis.downloadFile(serializedImage.data, fileName)
        }
    })

    const preRun = async () => {
      if (loadSampleInputs && usePreRun) {
        await loadSampleInputs(model, true)
        await this.run()
      }
    }

    const onSelectTab = async (event) => {
      if (event.detail.name === 'compareDoubleImages-panel') {
        const params = new URLSearchParams(window.location.search)
        if (!params.has('functionName') || params.get('functionName') !== 'compareDoubleImages') {
          params.set('functionName', 'compareDoubleImages')
          const url = new URL(document.location)
          url.search = params
          window.history.replaceState({ functionName: 'compareDoubleImages' }, '', url)
          await preRun()
        }
      }
    }

    const tabGroup = document.querySelector('sl-tab-group')
    tabGroup.addEventListener('sl-tab-show', onSelectTab)
    function onInit() {
      const params = new URLSearchParams(window.location.search)
      if (params.has('functionName') && params.get('functionName') === 'compareDoubleImages') {
        tabGroup.show('compareDoubleImages-panel')
        preRun()
      }
    }
    onInit()

    const runButton = document.querySelector('#compareDoubleImagesInputs sl-button[name="run"]')
    runButton.addEventListener('click', async (event) => {
      event.preventDefault()

      if(!model.inputs.has('testImage')) {
        globalThis.notify("Required input not provided", "testImage", "danger", "exclamation-octagon")
        return
      }


      try {
        runButton.loading = true

        const t0 = performance.now()
        const { metrics, differenceImage, differenceUchar2dImage, } = await this.run()
        const t1 = performance.now()
        globalThis.notify("compareDoubleImages successfully completed", `in ${t1 - t0} milliseconds.`, "success", "rocket-fill")

        model.outputs.set("metrics", metrics)
        metricsOutputDownload.variant = "success"
        metricsOutputDownload.disabled = false
        const metricsDetails = document.getElementById("compareDoubleImages-metrics-details")
        metricsDetails.innerHTML = `<pre>${globalThis.escapeHtml(JSON.stringify(metrics, globalThis.interfaceTypeJsonReplacer, 2))}</pre>`
        metricsDetails.disabled = false
        const metricsOutput = document.getElementById("compareDoubleImages-metrics-details")

        model.outputs.set("differenceImage", differenceImage)
        differenceImageOutputDownload.variant = "success"
        differenceImageOutputDownload.disabled = false
        const differenceImageDetails = document.getElementById("compareDoubleImages-difference-image-details")
        differenceImageDetails.innerHTML = `<pre>${globalThis.escapeHtml(JSON.stringify(differenceImage, globalThis.interfaceTypeJsonReplacer, 2))}</pre>`
        differenceImageDetails.disabled = false
        loadImage(differenceImage, differenceImageDetails)

        model.outputs.set("differenceUchar2dImage", differenceUchar2dImage)
        differenceUchar2dImageOutputDownload.variant = "success"
        differenceUchar2dImageOutputDownload.disabled = false
        const differenceUchar2dImageDetails = document.getElementById("compareDoubleImages-difference-uchar-2d-image-details")
        differenceUchar2dImageDetails.innerHTML = `<pre>${globalThis.escapeHtml(JSON.stringify(differenceUchar2dImage, globalThis.interfaceTypeJsonReplacer, 2))}</pre>`
        differenceUchar2dImageDetails.disabled = false
        loadImage(differenceUchar2dImage, differenceUchar2dImageDetails)
      } catch (error) {
        globalThis.notify("Error while running pipeline", error.toString(), "danger", "exclamation-octagon")
        throw error
      } finally {
        runButton.loading = false
      }
    })
  }

  async run() {
    const options = Object.fromEntries(this.model.options.entries())
    const { metrics, differenceImage, differenceUchar2dImage, } = await compareImages.compareDoubleImages(      this.model.inputs.get('testImage'),
      Object.fromEntries(this.model.options.entries())
    )

    return { metrics, differenceImage, differenceUchar2dImage, }
  }
}

const compareDoubleImagesController = new CompareDoubleImagesController(compareDoubleImagesLoadSampleInputs)
