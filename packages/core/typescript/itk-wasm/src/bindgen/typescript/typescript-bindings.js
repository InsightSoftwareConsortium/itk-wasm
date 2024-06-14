import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

import wasmBinaryInterfaceJson from '../wasm-binary-interface-json.js'
import camelCase from '../camel-case.js'

import packageToBundleName from './package-to-bundle-name.js'
import writeIfOverrideNotPresent from '../write-if-override-not-present.js'

import interfaceFunctionsDemoHtml from './demo/interface-functions-demo-html.js'
import interfaceFunctionsDemoTypeScript from './demo/interface-functions-demo-typescript.js'
import githubCorner from './demo/github-corner.js'
import writeSupportFiles from './write-support-files.js'
import resultsModule from './results-module.js'
import optionsModule from './options-module.js'
import functionModule from './function-module.js'
import outputOptionsCheck from '../output-options-check.js'
import inputArrayCheck from '../input-array-check.js'

// Array of types that will require an import from itk-wasm
function bindgenResource(filePath) {
  const currentScriptPath = path.dirname(fileURLToPath(import.meta.url))
  const resourcesDir = path.join(currentScriptPath, 'resources')
  const resourceFilePath = path.join(
    resourcesDir,
    filePath.split('/').join(path.sep)
  )
  return resourceFilePath
}

function typescriptBindings(
  outputDir,
  buildDir,
  wasmBinaries,
  options,
  forNode = false
) {
  console.log('wasmBinaries: ', wasmBinaries);
  // index module
  let indexContent = ''
  let indexCommonContent = "export { default as version } from './version.js'\n"
  const nodeTextKebab = forNode ? '-node' : ''
  const nodeTextCamel = forNode ? 'Node' : ''

  const srcOutputDir = path.join(outputDir, 'src')
  try {
    fs.mkdirSync(srcOutputDir, { recursive: true })
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }

  let readmeInterface = ''
  let readmePipelines = ''
  let demoFunctionsHtml = ''
  let pipelinesFunctionsTabs = ''
  let demoFunctionsTypeScript = ''

  const allUsedInterfaceTypes = new Set()

  const packageName = options.packageName
  const bundleName = packageToBundleName(packageName)
  const packageJsonPath = path.join(outputDir, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(
      fs.readFileSync(bindgenResource('template.package.json'))
    )
    packageJson.name = packageName
    packageJson.description = options.packageDescription
    packageJson.module = `./dist/index.js`
    packageJson.exports['.'].browser = `./dist/index.js`
    packageJson.exports['.'].node = `./dist/index-node.js`
    packageJson.exports['.'].default = `./dist/index-all.js`
    if (options.repository) {
      packageJson.repository = { type: 'git', url: options.repository }
    }
    if (options.packageVersion) {
      packageJson.version = options.packageVersion
    } else {
      packageJson.version = '0.1.0'
    }
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  } else {
    if (options.packageVersion) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath))
      packageJson.version = options.packageVersion
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    }
  }

  if (!forNode) {
    indexContent += "export * from './pipelines-base-url.js'\n"
    indexContent += "export * from './pipeline-worker-url.js'\n"
    indexContent += "export * from './default-web-worker.js'\n"
  }

  writeSupportFiles(
    outputDir,
    forNode,
    bindgenResource,
    packageName,
    options.packageDescription
  )

  let firstFunctionName = null
  wasmBinaries.forEach((wasmBinaryName) => {
    let wasmBinaryRelativePath = `${buildDir}/${wasmBinaryName}`
    if (!fs.existsSync(wasmBinaryRelativePath)) {
      wasmBinaryRelativePath = wasmBinaryName
    }
    const distPipelinesDir = path.join(outputDir, 'dist', 'pipelines')
    try {
      fs.mkdirSync(distPipelinesDir, { recursive: true })
    } catch (err) {
      if (err.code !== 'EEXIST') throw err
    }
    fs.copyFileSync(
      wasmBinaryRelativePath,
      path.join(distPipelinesDir, path.basename(wasmBinaryRelativePath))
    )
    fs.copyFileSync(
      `${wasmBinaryRelativePath}.zst`,
      path.join(
        distPipelinesDir,
        `${path.basename(wasmBinaryRelativePath)}.zst`
      )
    )
    const prefix = wasmBinaryRelativePath.substring(
      0,
      wasmBinaryRelativePath.length - 5
    )
    fs.copyFileSync(
      `${prefix}.js`,
      path.join(distPipelinesDir, `${path.basename(prefix)}.js`)
    )

    const { interfaceJson, parsedPath } = wasmBinaryInterfaceJson(
      outputDir,
      buildDir,
      wasmBinaryName
    )

    outputOptionsCheck(interfaceJson)
    inputArrayCheck(interfaceJson)

    const moduleKebabCase = parsedPath.name
    const moduleCamelCase = camelCase(parsedPath.name)
    const modulePascalCase = `${moduleCamelCase[0].toUpperCase()}${moduleCamelCase.substring(1)}`
    const functionName = camelCase(interfaceJson.name)
    if (!firstFunctionName) {
      firstFunctionName = functionName
      demoFunctionsTypeScript += `\nconst params = new URLSearchParams(window.location.search)
if (!params.has('functionName')) {
  params.set('functionName', '${firstFunctionName}')
  const url = new URL(document.location)
  url.search = params
  window.history.replaceState({ functionName: '${firstFunctionName}' }, '', url)
}
`
    }

    const useCamelCase = true
    const functionDemoHtml = interfaceFunctionsDemoHtml(
      interfaceJson,
      functionName,
      useCamelCase
    )
    if (functionDemoHtml) {
      demoFunctionsHtml += functionDemoHtml
      pipelinesFunctionsTabs += `    <sl-tab slot="nav" panel="${functionName}-panel">${functionName}</sl-tab>\n`
      const demoTypeScriptOutputPath = path.join(
        outputDir,
        'test',
        'browser',
        'demo-app'
      )
      interfaceFunctionsDemoTypeScript(
        packageName,
        interfaceJson,
        demoTypeScriptOutputPath
      )
      demoFunctionsTypeScript += `import './${interfaceJson.name}-controller.js'\n`
    } else {
      pipelinesFunctionsTabs += `    <sl-tab slot="nav" panel="${functionName}-panel" disabled>${functionName}</sl-tab>\n`
    }

    readmeInterface += `  ${moduleCamelCase}${nodeTextCamel},\n`

    const resultsModuleFileName = `${moduleKebabCase}${nodeTextKebab}-result`
    const { readmeResult } = resultsModule(
      srcOutputDir,
      interfaceJson,
      forNode,
      modulePascalCase,
      nodeTextCamel,
      resultsModuleFileName
    )
    indexContent += `\n\nimport ${modulePascalCase}${nodeTextCamel}Result from './${resultsModuleFileName}.js'\n`
    indexContent += `export type { ${modulePascalCase}${nodeTextCamel}Result }\n\n`

    const filteredParameters = interfaceJson.parameters.filter((p) => {
      return p.name !== 'memory-io' && p.name !== 'version'
    })
    const haveOptions = !!filteredParameters.length || !forNode

    const optionsModuleFileName = `${moduleKebabCase}${nodeTextKebab}-options`
    const { readmeOptions } = optionsModule(
      srcOutputDir,
      interfaceJson,
      modulePascalCase,
      nodeTextCamel,
      haveOptions,
      forNode,
      optionsModuleFileName
    )
    if (haveOptions) {
      indexContent += `import ${modulePascalCase}${nodeTextCamel}Options from './${optionsModuleFileName}.js'\n`
      indexContent += `export type { ${modulePascalCase}${nodeTextCamel}Options }\n\n`
    }

    const { readmeFunction, usedInterfaceTypes } = functionModule(
      srcOutputDir,
      forNode,
      interfaceJson,
      modulePascalCase,
      moduleKebabCase,
      moduleCamelCase,
      nodeTextCamel,
      nodeTextKebab,
      haveOptions
    )
    usedInterfaceTypes.forEach((iType) => allUsedInterfaceTypes.add(iType))

    indexContent += `import ${moduleCamelCase}${nodeTextCamel} from './${moduleKebabCase}${nodeTextKebab}.js'\n`
    indexContent += `export { ${moduleCamelCase}${nodeTextCamel} }\n`

    readmePipelines += readmeFunction
    readmePipelines += readmeOptions
    readmePipelines += readmeResult
  })

  if (allUsedInterfaceTypes.size > 0) {
    indexCommonContent += '\n'
    allUsedInterfaceTypes.forEach(
      (iType) =>
        (indexCommonContent += `export type { ${iType} } from 'itk-wasm'\n`)
    )
  }

  if (!forNode) {
    readmeInterface += `  setPipelinesBaseUrl,
  getPipelinesBaseUrl,
`
  }
  readmeInterface += `} from "${packageName}"\n\`\`\`\n`
  readmeInterface += readmePipelines

  const indexPath = path.join(srcOutputDir, `index${nodeTextKebab}-only.ts`)
  writeIfOverrideNotPresent(indexPath, indexContent)

  const indexCommonPath = path.join(srcOutputDir, `index-common.ts`)
  writeIfOverrideNotPresent(indexCommonPath, indexCommonContent)

  const indexEnvContent = `export * from './index-common.js'
export * from './index${nodeTextKebab}-only.js'
`
  const indexEnvPath = path.join(srcOutputDir, `index${nodeTextKebab}.ts`)
  writeIfOverrideNotPresent(indexEnvPath, indexEnvContent)

  const indexAllContent = `export * from './index-common.js'
export * from './index-only.js'
export * from './index-node-only.js'
`
  const indexAllPath = path.join(srcOutputDir, `index-all.ts`)
  writeIfOverrideNotPresent(indexAllPath, indexAllContent)

  if (!forNode) {
    const demoIndexPath = path.join(
      outputDir,
      'test',
      'browser',
      'demo-app',
      'index.html'
    )
    let demoIndexContent = fs.readFileSync(
      bindgenResource(path.join('demo-app', 'index.html')),
      { encoding: 'utf8', flag: 'r' }
    )
    const shoelaceScript = `
<script type="module">
  import '@itk-wasm/demo-app/demo-app.js'
</script>
`
    demoIndexContent = demoIndexContent.replaceAll(
      '@shoelaceScript@',
      shoelaceScript
    )
    const packageNameLanguageLogos = `${packageName}<img src="./javascript-logo.svg" alt="JavaScript logo" class="language-logo"/><img src="./typescript-logo.svg" alt="TypeScript logo" class="language-logo"/>`
    demoIndexContent = demoIndexContent.replaceAll(
      '@bindgenPackageName@',
      packageNameLanguageLogos
    )
    demoIndexContent = demoIndexContent.replaceAll(
      '@bindgenPackageDescription@',
      options.packageDescription
    )
    const bindgenGitHubCorner = githubCorner(options)
    demoIndexContent = demoIndexContent.replaceAll(
      '@bindgenGitHubCorner@',
      bindgenGitHubCorner
    )
    demoIndexContent = demoIndexContent.replaceAll(
      '@bindgenFunctions@',
      demoFunctionsHtml
    )
    demoIndexContent = demoIndexContent.replaceAll(
      '@pipelinesFunctionsTabs@',
      pipelinesFunctionsTabs
    )
    const indexModule = `
<script type="module" src="./index.ts"></script>
`
    demoIndexContent = demoIndexContent.replaceAll('@indexModule@', indexModule)
    writeIfOverrideNotPresent(demoIndexPath, demoIndexContent, '<!--')

    const demoTypeScriptPath = path.join(
      outputDir,
      'test',
      'browser',
      'demo-app',
      'index.ts'
    )
    let demoTypeScriptContent = fs.readFileSync(
      bindgenResource(path.join('demo-app', 'index.ts')),
      { encoding: 'utf8', flag: 'r' }
    )
    demoTypeScriptContent = demoTypeScriptContent.replaceAll(
      '@bindgenBundleName@',
      bundleName
    )
    demoTypeScriptContent = demoTypeScriptContent.replaceAll(
      '@bindgenBundleNameCamelCase@',
      camelCase(bundleName)
    )
    demoTypeScriptContent = demoTypeScriptContent.replaceAll(
      '@bindgenFunctionLogic@',
      demoFunctionsTypeScript
    )
    writeIfOverrideNotPresent(demoTypeScriptPath, demoTypeScriptContent)
  }

  return readmeInterface
}

export default typescriptBindings
