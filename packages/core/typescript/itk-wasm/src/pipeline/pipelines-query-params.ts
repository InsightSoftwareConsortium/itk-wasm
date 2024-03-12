import RunPipelineOptions from './run-pipeline-options'

let pipelinesQueryParams: RunPipelineOptions['pipelineQueryParams'] | undefined

export function setPipelinesQueryParams (queryParams: RunPipelineOptions['pipelineQueryParams']): void {
  pipelinesQueryParams = queryParams
}

export function getPipelinesQueryParams (): RunPipelineOptions['pipelineQueryParams'] | undefined {
  return pipelinesQueryParams
}
