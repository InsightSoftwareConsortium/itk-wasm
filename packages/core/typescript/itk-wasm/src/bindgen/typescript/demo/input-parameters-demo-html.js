import camelCase from '../../camel-case.js'
import snakeCase from '../../snake-case.js'

function inputParametersDemoHtml (functionName, prefix, indent, parameter, required, useCamelCase) {
  let result = ''
  const description = parameter.description.replaceAll('"', '&quot;')
  const requiredAttr = required ? 'required ' : ''
  const label = useCamelCase ? camelCase(parameter.name) : snakeCase(parameter.name)
  const tooltipContent = `content="Use the Upload button to provide the ${label}"`
  const parameterType = parameter.type.split(' ')[0].split(':')[0]
  switch (parameterType) {
    case 'INPUT_TEXT_FILE':
    case 'INPUT_TEXT_STREAM': {
      result += `${prefix}${indent}<sl-tooltip ${tooltipContent}><sl-details id="${functionName}-${parameter.name}-details"  summary="${label}: ${description}" disabled></sl-details></sl-tooltip>\n`
      const multiple = parameter.itemsExpectedMax > 1 ? 'multiple ' : ''
      result += `${prefix}${indent}<label for="${parameter.name}-file"><sl-button name="${parameter.name}-file-button" variant="primary" outline onclick="this.parentElement.nextElementSibling.click()">Upload</sp-button></label><input type="file" ${multiple} name="${parameter.name}-file" style="display: none"/>\n`
      result += '<br /><br />\n'
    }
      break
    case 'INPUT_BINARY_FILE':
    case 'INPUT_BINARY_STREAM': {
      result += `${prefix}${indent}<sl-tooltip ${tooltipContent}><sl-details id="${functionName}-${parameter.name}-details" summary="${label}: ${description}" disabled></sl-details></sl-tooltip>\n`
      const multiple = parameter.itemsExpectedMax > 1 ? 'multiple ' : ''
      result += `${prefix}${indent}<label for="${parameter.name}-file"><sl-button name="${parameter.name}-file-button" ${requiredAttr}variant="primary" outline onclick="this.parentElement.nextElementSibling.click()">Upload</sl-button></label><input type="file" ${multiple} name="${parameter.name}-file" style="display: none"/>\n`
      result += '<br /><br />\n'
    }
      break
    case 'TEXT':
    case 'OUTPUT_TEXT_FILE':
    case 'OUTPUT_BINARY_FILE':
      result += `${prefix}${indent}<sl-input ${requiredAttr}name="${parameter.name}" type="text" label="${label}" help-text="${description}"></sl-input>\n`
      break
    case 'INT':
    case 'UINT':
    case 'FLOAT': {
      const typeName = parameter.itemsExpectedMax > 1 ? "text" : "number"
      let constraints = ''
      if (parameter.itemsExpected !== 1) {
        constraints = ''
      } else if (parameterType === 'INT') {
        constraints = 'step="1" '
      } else if (parameterType === 'UINT') {
        constraints = 'min="0" step="1" '
      } else if (parameterType === 'FLOAT') {
        constraints = 'step="any" '
      }
      result += `${prefix}${indent}<sl-input ${requiredAttr}name="${parameter.name}" type="${typeName}" value="${parameter.default}" ${constraints}label="${label}" help-text="${description}"></sl-input>\n`
      result += '<br />\n'
    }
      break
    case 'BOOL':
      result += `${prefix}${indent}<sl-checkbox name="${parameter.name}">${label} - <i>${description}</i></sl-checkbox>\n`
      result += '<br /><br />\n'
      break
    case 'INPUT_JSON':
    case 'INPUT_IMAGE':
    case 'INPUT_MESH':
      result += `${prefix}${indent}<label for="${parameter.name}-file"><sl-button name="${parameter.name}-file-button" variant="primary" outline onclick="this.parentElement.nextElementSibling.click()">Upload</sp-button></label><input type="file" name="${parameter.name}-file" style="display: none"/>\n`
      result += `${prefix}${indent}<sl-tooltip ${tooltipContent}><sl-details id="${functionName}-${parameter.name}-details" summary="${label}: ${description}" disabled></sl-details></sl-tooltip>\n`
      result += '<br /><br />\n'
      break
    default:
      console.error(`Unexpected interface type: ${parameterType}`)
      process.exit(1)
  }
  return result
}

export default inputParametersDemoHtml
