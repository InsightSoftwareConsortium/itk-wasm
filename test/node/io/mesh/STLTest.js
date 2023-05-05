import test from 'ava'
import path from 'path'

import { IntTypes, FloatTypes, PixelTypes, readMeshLocalFile, writeMeshLocalFile } from '../../../../dist/index.js'

const testInputFilePath = path.resolve('build-emscripten', 'ExternalData', 'test', 'Input', 'sphere.stl')
const testOutputFilePath = path.resolve('build-emscripten', 'Testing', 'Temporary', 'STLTest-sphere.stl')

const verifyMesh = (t, mesh) => {
  t.is(mesh.meshType.dimension, 3)
  t.is(mesh.meshType.pointComponentType, FloatTypes.Float32)
  t.is(mesh.meshType.cellComponentType, IntTypes.UInt32)
  t.is(mesh.meshType.pointPixelType, PixelTypes.Scalar)
  t.is(mesh.meshType.cellPixelType, PixelTypes.Scalar)
  t.is(mesh.numberOfPoints, 18)
  t.is(mesh.numberOfCells, 32)
}

test('readMeshLocalFile reads a STL file path given on the local filesystem', t => {
  return readMeshLocalFile(testInputFilePath).then(function (mesh) {
    verifyMesh(t, mesh)
  })
})

test('writeMeshLocalFile writes a STL file path on the local filesystem', (t) => {
  return readMeshLocalFile(testInputFilePath)
    .then(function (mesh) {
      return writeMeshLocalFile(mesh, testOutputFilePath)
    })
    .then(function () {
      return readMeshLocalFile(testOutputFilePath).then(function (mesh) {
        verifyMesh(t, mesh)
      })
    })
})