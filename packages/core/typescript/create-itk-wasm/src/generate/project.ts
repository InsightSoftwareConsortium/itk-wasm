import path from 'path'
import fs from 'fs'

import chalk from 'chalk'

import ProjectSpec from '../project-spec.js'
import PipelineSpec from '../pipeline-spec.js'
import isValidPackageName from '../is-valid-package-name.js'
import die from '../die.js'

import generateReadme from './readme.js'
import generatePackageJson from './package-json.js'
import generateEnvironmentYml from './environment-yml.js'
import generateCMakelists from './cmakelists.js'
import generatePipeline from './pipeline.js'
import generatePnpmWorkspace from './pnpm-workspace.js'

function generateProject(
  project: ProjectSpec,
  pipelines: PipelineSpec[],
  verbose: boolean = false
) {
  if (!isValidPackageName(project.name)) {
    die(
      `Invalid project name: ${project.name}. Must be a valid npm package name (lowercase and hyphens).`
    )
  }
  if (!project.packageDescription) {
    die('A description must be specified for the project.')
  }
  if (pipelines.length === 0) {
    die('At least one pipeline must be specified.')
  }

  if (verbose) {
    console.log(chalk.cyanBright(`\n🛠  Generating project ${project.name}...`))
  }

  if (!project.directory) {
    project.directory = path.join(process.cwd(), project.name)
  }
  fs.mkdirSync(project.directory, { recursive: true })

  generateReadme(project)
  generatePackageJson(project)
  generateEnvironmentYml(project)
  generateCMakelists(project)
  generatePnpmWorkspace(project)

  pipelines.forEach((pipeline) => {
    generatePipeline(project, pipeline, verbose)
  })

  if (verbose) {
    console.log(chalk.cyanBright('💖 Finished.'))
    console.log(
      `${chalk.cyanBright('\n📂  Directory:   ')} ${project.directory}`
    )
    console.log(`${chalk.cyanBright('📦  Name:        ')} ${project.name}`)
    console.log(
      `${chalk.cyanBright('📄  Description: ')} ${project.packageDescription}`
    )
    console.log(chalk.magentaBright(`\n🚀  Next steps:`))
    console.log(chalk.green(`\ncd ${project.directory}`))
    console.log(chalk.green(`pnpm install`))
    console.log(chalk.green(`pnpm build`))
    console.log(chalk.green(`pnpm test\n`))
  }
}

export default generateProject
