import { version } from './index.js'

const itkConfig = {
  webWorkersUrl: undefined,
  pipelineWorkerUrl: `https://cdn.jsdelivr.net/npm/itk-wasm@${version}/dist/web-workers/min-bundles/pipeline.worker.js`,
  imageIOUrl: `https://cdn.jsdelivr.net/npm/itk-image-io@${version}`,
  meshIOUrl: `https://cdn.jsdelivr.net/npm/itk-mesh-io@${version}`,
  pipelinesUrl: `https://cdn.jsdelivr.net/npm/itk-wasm@${version}/dist/pipelines`
}

export default itkConfig
