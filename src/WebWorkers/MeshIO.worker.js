import registerWebworker from 'webworker-promise/lib/register'

import MeshType from '../MeshType'
import Mesh from '../Mesh'

import mimeToIO from '../MimeToMeshIO'
import getFileExtension from '../getFileExtension'
import extensionToIO from '../extensionToMeshIO'
import MeshIOIndex from '../MeshIOIndex'

import readMeshEmscriptenFSFile from '../readMeshEmscriptenFSFile'
import writeMeshEmscriptenFSFile from '../writeMeshEmscriptenFSFile'

const loadEmscriptenModule = (itkModulesPath, io) => {
  let modulePath = itkModulesPath + '/MeshIOs/' + io + '.js'
  if (typeof WebAssembly === 'object' && typeof WebAssembly.Memory === 'function') {
    modulePath = itkModulesPath + '/MeshIOs/' + io + 'Wasm.js'
  }
  importScripts(modulePath)
  return Module
}

// To cache loaded io modules
let ioToModule = {}

const readMesh = (input, withTransferList) => {
  const extension = getFileExtension(input.name)

  let io = null
  if (mimeToIO.hasOwnProperty(input.type)) {
    io = mimeToIO[input.type]
  } else if (extensionToIO.hasOwnProperty(extension)) {
    io = extensionToIO[extension]
  } else {
    for (let idx = 0; idx < MeshIOIndex.length; ++idx) {
      let ioModule = null
      const trialIO = MeshIOIndex[idx]
      if (trialIO in ioToModule) {
        ioModule = ioToModule[trialIO]
      } else {
        ioToModule[trialIO] = loadEmscriptenModule(input.config.itkModulesPath, trialIO)
        ioModule = ioToModule[trialIO]
      }
      const meshIO = new ioModule.ITKMeshIO()
      const blob = new Blob([input.data])
      const blobs = [{ name: input.name, data: blob }]
      const mountpoint = '/work'
      ioModule.mountBlobs(mountpoint, blobs)
      const filePath = mountpoint + '/' + input.name
      meshIO.SetFileName(filePath)
      if (meshIO.CanReadFile(filePath)) {
        io = trialIO
        ioModule.unmountBlobs(mountpoint)
        break
      }
      ioModule.unmountBlobs(mountpoint)
    }
  }
  if (io === null) {
    ioToModule = {}
    return Promise.reject(new Error('Could not find IO for: ' + input.name))
  }

  let ioModule = null
  if (io in ioToModule) {
    ioModule = ioToModule[io]
  } else {
    ioToModule[io] = loadEmscriptenModule(input.config.itkModulesPath, io)
    ioModule = ioToModule[io]
  }

  const blob = new Blob([input.data])
  const blobs = [{ name: input.name, data: blob }]
  const mountpoint = '/work'
  ioModule.mountBlobs(mountpoint, blobs)
  const filePath = mountpoint + '/' + input.name
  const mesh = readMeshEmscriptenFSFile(ioModule, filePath)
  ioModule.unmountBlobs(mountpoint)

  const transferables = []
  if(mesh.points.buffer) {
    transferables.push(mesh.points.buffer)
  }
  if(mesh.pointData.buffer) {
    transferables.push(mesh.pointData.buffer)
  }
  if(mesh.cells.buffer) {
    transferables.push(mesh.cells.buffer)
  }
  if(mesh.cellData.buffer) {
    transferables.push(mesh.cellData.buffer)
  }
  return new registerWebworker.TransferableResponse(mesh, transferables)
}

const writeMesh = (input, withTransferList) => {
  const extension = getFileExtension(input.name)

  let io = null
  if (mimeToIO.hasOwnProperty(input.type)) {
    io = mimeToIO[input.type]
  } else if (extensionToIO.hasOwnProperty(extension)) {
    io = extensionToIO[extension]
  } else {
    for (let idx = 0; idx < MeshIOIndex.length; ++idx) {
      let ioModule = null
      const trialIO = MeshIOIndex[idx]
      if (trialIO in ioToModule) {
        ioModule = ioToModule[trialIO]
      } else {
        ioToModule[trialIO] = loadEmscriptenModule(input.config.itkModulesPath, trialIO)
        ioModule = ioToModule[trialIO]
      }
      const meshIO = new ioModule.ITKMeshIO()
      const filePath = mountpoint + '/' + input.name
      meshIO.SetFileName(filePath)
      if (meshIO.CanWriteFile(filePath)) {
        io = trialIO
        break
      }
    }
  }
  if (io === null) {
    ioToModule = {}
    return Promise.reject(new Error('Could not find IO for: ' + input.name))
  }

  let ioModule = null
  if (io in ioToModule) {
    ioModule = ioToModule[io]
  } else {
    ioToModule[io] = loadEmscriptenModule(input.config.itkModulesPath, io)
    ioModule = ioToModule[io]
  }

  const mountpoint = '/work'
  const filePath = mountpoint + '/' + input.name
  ioModule.mkdirs(mountpoint)
  writeMeshEmscriptenFSFile(ioModule, input.useCompression, input.mesh, filePath)
  const writtenFile = ioModule.readFile(filePath, { encoding: "binary" })

  return new registerWebworker.TransferableResponse(writtenFile.buffer, [writtenFile.buffer])
}

registerWebworker(function (input) {
  if (input.operation === "readMesh") {
    return Promise.resolve(readMesh(input))
  } else if (input.operation === "writeMesh") {
    return Promise.resolve(writeMesh(input))
  } else {
    return Promise.resolve(new Error('Unknown worker operation'))
  }
})
