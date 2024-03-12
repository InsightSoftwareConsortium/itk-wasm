import fs from 'fs'
import path from 'path'

import ProjectSpec from '../project-spec.js'
import die from '../die.js'

function generatePackageJson(project: ProjectSpec) {
  if (!project.typescriptPackageName) {
    die('typescript-package-name is required')
  }
  if (!project.pythonPackageName) {
    die('python-package-name is required')
  }

  const itkWasm = {
    'package-description': project.packageDescription,
    'typescript-package-name': project.typescriptPackageName,
    'python-package-name': project.pythonPackageName
  }
  if (project.repositoryUrl) {
    // @ts-ignore
    itkWasm.repository = project.repositoryUrl
  }
  const packageManager = 'pnpm@8.15.1'
  let packageJson = {
    name: `${project.name}-build`,
    version: '0.1.0',
    private: true,
    packageManager,
    description: `Scripts to generate ${project.name} itk-wasm artifacts.`,
    type: 'module',
    'itk-wasm': itkWasm,
    license: project.license,
    scripts: {
      build: 'pnpm build:gen:typescript && pnpm build:gen:python',
      'build:emscripten': 'itk-wasm pnpm-script build:emscripten',
      'build:emscripten:debug': 'itk-wasm pnpm-script build:emscripten:debug',
      'build:wasi': 'itk-wasm pnpm-script build:wasi',
      'build:wasi:debug': 'itk-wasm pnpm-script build:wasi:debug',
      'build:python:wasi': 'itk-wasm pnpm-script build:python:wasi',
      'bindgen:typescript': 'itk-wasm pnpm-script bindgen:typescript',
      'bindgen:python': 'itk-wasm pnpm-script bindgen:python',
      'build:gen:typescript': 'itk-wasm pnpm-script build:gen:typescript',
      'build:gen:python': 'itk-wasm pnpm-script build:gen:python',
      'build:micromamba': 'itk-wasm pnpm-script build:micromamba',
      'build:python:versionSync':
        'itk-wasm pnpm-script build:python:versionSync',
      'publish:python': 'itk-wasm pnpm-script publish:python',
      test: 'pnpm test:data:download && pnpm build:gen:python && pnpm test:python',
      'test:data:download':
        'dam download test/data test/data.tar.gz bafkreigpkk3pqcoqzjzcauogw6dml52yig3ksmcrobau5pkoictymizzri https://github.com/InsightSoftwareConsortium/itk-wasm/releases/download/itk-wasm-v1.0.0-b.163/create-itk-wasm-test-data.tar.gz https://bafybeiczuxeuma5cjuli5mtapqnjqypeaum5ikd45zcmfhtt2emp365tca.ipfs.w3s.link/ipfs/bafybeiczuxeuma5cjuli5mtapqnjqypeaum5ikd45zcmfhtt2emp365tca/create-itk-wasm-test-data.tar.gz https://ipfs.filebase.io/ipfs/QmcxyvUKnaoTTwUqEPXwp1sdcbrFh3XnnwckLKVRpctJx9',
      'test:data:pack': 'dam pack test/data test/data.tar.gz',
      'test:python:wasi': 'itk-wasm pnpm-script test:python:wasi',
      'test:python:emscripten': 'itk-wasm pnpm-script test:python:emscripten',
      'test:python:dispatch': 'itk-wasm pnpm-script test:python:emscripten',
      'test:python': 'itk-wasm pnpm-script test:python',
      'test:wasi': 'itk-wasm pnpm-script test:wasi'
    },
    devDependencies: {
      '@itk-wasm/dam': '^1.1.1',
      '@thewtex/setup-micromamba': '^1.9.7',
      'itk-wasm': '1.0.0-b.171'
    }
  }
  if (project.author) {
    // @ts-ignore
    packageJson.author = project.author
  }
  if (project.repositoryUrl) {
    // @ts-ignore
    packageJson.repository = {
      type: 'git',
      url: project.repositoryUrl
    }
  }
  const packageJsonPath = path.join(project.directory, 'package.json')
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

export default generatePackageJson
