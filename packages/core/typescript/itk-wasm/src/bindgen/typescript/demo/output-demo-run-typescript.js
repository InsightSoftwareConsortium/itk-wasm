import camelCase from "../../camel-case.js"

function outputDemoRunTypeScript(functionName, prefix, indent, parameter) {
  const parameterName = camelCase(parameter.name)
  let result = `\n${prefix}${indent}model.outputs.set("${parameterName}", ${parameterName})\n`

  switch(parameter.type) {
    case 'OUTPUT_TEXT_FILE':
    case 'OUTPUT_TEXT_FILE:FILE':
    case 'OUTPUT_TEXT_STREAM': {
      result += `${prefix}${indent}${parameterName}OutputDownload.variant = "success"\n`
      result += `${prefix}${indent}${parameterName}OutputDownload.disabled = false\n`
      result += `${prefix}${indent}const ${parameterName}Output = document.getElementById("${functionName}-${parameter.name}-details")\n`
      const textDataProp = parameter.type.includes('FILE') ? '.data' : ''
      if (parameter.itemsExpectedMax > 1) {
        result += `${prefix}${indent}${parameterName}Output.innerHTML = \`<pre>$\{globalThis.escapeHtml(JSON.stringify(${parameterName}))}</pre>\`\n`
      } else {
        result += `${prefix}${indent}${parameterName}Output.innerHTML = \`<pre>$\{globalThis.escapeHtml(${parameterName}${textDataProp}.substring(0, 1024).toString() + ' ...')}</pre>\`\n`
      }
      result += `${prefix}${indent}${parameterName}Output.disabled = false\n`
    }
      break
    case 'OUTPUT_BINARY_FILE':
    case 'OUTPUT_BINARY_FILE:FILE':
    case 'OUTPUT_BINARY_STREAM': {
      result += `${prefix}${indent}${parameterName}OutputDownload.variant = "success"\n`
      result += `${prefix}${indent}${parameterName}OutputDownload.disabled = false\n`
      result += `${prefix}${indent}const ${parameterName}Output = document.getElementById("${functionName}-${parameter.name}-details")\n`
      const binaryDataProp = parameter.type.includes('FILE') ? '.data' : ''
      if (parameter.itemsExpectedMax > 1) {
        result += `${prefix}${indent}${parameterName}Output.innerHTML = \`<pre>$\{globalThis.escapeHtml(JSON.stringify(${parameterName})}</pre>\`\n`
      } else {
        result += `${prefix}${indent}${parameterName}Output.innerHTML = \`<pre>$\{globalThis.escapeHtml(${parameterName}${binaryDataProp}.subarray(0, 1024).toString() + ' ...')}</pre>\`\n`
      }
      result += `${prefix}${indent}${parameterName}Output.disabled = false\n`
    }
      break
    case 'OUTPUT_JSON':
      result += `${prefix}${indent}${parameterName}OutputDownload.variant = "success"\n`
      result += `${prefix}${indent}${parameterName}OutputDownload.disabled = false\n`
      result += `${indent}${indent}const ${parameterName}Details = document.getElementById("${functionName}-${parameter.name}-details")\n`
      result += `${indent}${indent}${parameterName}Details.innerHTML = \`<pre>$\{globalThis.escapeHtml(JSON.stringify(${parameterName}, globalThis.interfaceTypeJsonReplacer, 2))}</pre>\`\n`
      result += `${indent}${indent}${parameterName}Details.disabled = false\n`
      result += `${prefix}${indent}const ${parameterName}Output = document.getElementById("${functionName}-${parameter.name}-details")\n`
      break
    case 'OUTPUT_IMAGE':
    case 'OUTPUT_MESH':
      result += `${prefix}${indent}${parameterName}OutputDownload.variant = "success"\n`
      result += `${prefix}${indent}${parameterName}OutputDownload.disabled = false\n`
      result += `${indent}${indent}const ${parameterName}Details = document.getElementById("${functionName}-${parameter.name}-details")\n`
      result += `${indent}${indent}${parameterName}Details.innerHTML = \`<pre>$\{globalThis.escapeHtml(JSON.stringify(${parameterName}, globalThis.interfaceTypeJsonReplacer, 2))}</pre>\`\n`
      result += `${indent}${indent}${parameterName}Details.disabled = false\n`
      if(parameter.type === 'OUTPUT_IMAGE' && parameter.itemsExpectedMax === 1) {
        result += `${indent}${indent}loadImage(${parameterName}, ${parameterName}Details)\n`
      }
      break
    default:
      console.error(`Unexpected interface type: ${parameter.type}`)
      process.exit(1)
  }
  return result
}

export default outputDemoRunTypeScript
