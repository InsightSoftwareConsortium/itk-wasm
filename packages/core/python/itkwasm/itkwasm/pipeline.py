import json
from pathlib import Path, PurePosixPath
from dataclasses import asdict
from typing import List, Union, Dict, Tuple, Set
import ctypes
import sys

import numpy as np
try:
    from numpy.typing import ArrayLike
except ImportError:
    from numpy import ndarray as ArrayLike

from .interface_types import InterfaceTypes
from .pipeline_input import PipelineInput
from .pipeline_output import PipelineOutput
from .text_stream import TextStream
from .binary_stream import BinaryStream
from .text_file import TextFile
from .binary_file import BinaryFile
from .image import Image
from .mesh import Mesh
from .polydata import PolyData
from .json_compatible import JsonCompatible
from .int_types import IntTypes
from .float_types import FloatTypes
from .to_numpy_array import buffer_to_numpy_array, array_like_to_numpy_array, array_like_to_bytes

if sys.platform != "emscripten":
    import zlib
    from platformdirs import user_cache_dir

    from wasmtime import Config, Store, Engine, Module, WasiConfig, Linker, WasmtimeError

    _module_store_dir = Path(user_cache_dir("itkwasm"))
    _module_store_dir.mkdir(parents=True, exist_ok=True)

def array_like_to_bytes(arr: ArrayLike) -> bytes:
    """Convert a numpy array-like to bytes."""
    if hasattr(arr, 'tobytes'):
        return arr.tobytes()
    return array_like_to_numpy_array(arr).tobytes()

class RunInstance:
    """Helper for working with the wasm module instance created when a Pipeline is run."""

    def __init__(self, engine: "Engine", linker: "Linker", module: "Module", args: List[str], preopen_directories: Set[str]):
        self._store = Store(engine)
        store = self._store

        wasi_config = WasiConfig()
        wasi_config.inherit_env()
        wasi_config.inherit_stderr()
        wasi_config.inherit_stdin()
        wasi_config.inherit_stdout()
        wasi_config.argv = args

        for preopen in preopen_directories:
            wasi_config.preopen_dir(preopen, preopen)

        store.set_wasi(wasi_config)

        instance = linker.instantiate(store, module)
        self._instance = instance

        self._memory = instance.exports(store)["memory"]
        self._input_array_alloc = instance.exports(store)["itk_wasm_input_array_alloc"]
        self._input_json_alloc = instance.exports(store)["itk_wasm_input_json_alloc"]
        self._output_array_address = instance.exports(store)["itk_wasm_output_array_address"]
        self._output_array_size = instance.exports(store)["itk_wasm_output_array_size"]
        self._output_json_address = instance.exports(store)["itk_wasm_output_json_address"]
        self._output_json_size = instance.exports(store)["itk_wasm_output_json_size"]

        _initialize = instance.exports(store)["_initialize"]
        _initialize(store)

    def wasmtime_lift(self, ptr: int, size: int):
        ptr = ptr & 0xffffffff
        size = size & 0xffffffff
        if ptr + size > self._memory.data_len(self._store):
            raise IndexError('attempting to lift of bounds')
        raw_base = self._memory.data_ptr(self._store)
        base = ctypes.POINTER(ctypes.c_ubyte)(
            ctypes.c_ubyte.from_address(ctypes.addressof(raw_base.contents) + ptr)
        )
        return ctypes.string_at(base, size)

    def wasmtime_lower(self, ptr: int, data: Union[bytes, bytearray]):
        ptr = ptr & 0xffffffff
        size = len(data)
        if ptr + size > self._memory.data_len(self._store):
            raise IndexError('attempting to lower out of bounds')
        raw_base = self._memory.data_ptr(self._store)
        base = ctypes.POINTER(ctypes.c_ubyte)(
            ctypes.c_ubyte.from_address(ctypes.addressof(raw_base.contents) + ptr)
        )
        ctypes.memmove(base, data, size)

    def set_input_array(self, data_array: Union[bytes, bytearray], input_index: int, sub_index: int) -> int:
        data_ptr = 0
        if data_array != None:
            data_ptr = self._input_array_alloc(self._store, 0, input_index, sub_index, len(data_array))
            self.wasmtime_lower(data_ptr, data_array)
        return data_ptr

    def set_input_json(self, data_object: Dict, input_index: int) -> None:
        data_json = json.dumps(data_object).encode()
        json_ptr = self._input_json_alloc(self._store, 0, input_index, len(data_json))
        self.wasmtime_lower(json_ptr, data_json)

    def get_output_json(self, output_index: int) -> Dict:
        json_ptr = self._output_json_address(self._store, 0, output_index)
        json_len = self._output_json_size(self._store, 0, output_index)
        json_str = self.wasmtime_lift(json_ptr, json_len).decode()
        json_result = json.loads(json_str)
        return json_result

    def get_output_array_address(self, memory: int, output_index: int, output_sub_index: int) -> Dict:
        return self._output_array_address(self._store, memory, output_index, output_sub_index)

    def get_output_array_size(self, memory: int, output_index: int, output_sub_index: int) -> Dict:
        return self._output_array_size(self._store, memory, output_index, output_sub_index)

    def delayed_start(self):
        func = self._instance.exports(self._store)["itk_wasm_delayed_start"]
        return_code = func(self._store)
        return return_code

    def delayed_exit(self, return_code):
        func = self._instance.exports(self._store)["itk_wasm_delayed_exit"]
        func(self._store, return_code)

class Pipeline:
    """Run an itk-wasm WASI pipeline."""

    def __init__(self, pipeline: Union[str, Path, bytes]):
        """Compile the pipeline."""
        self.config = Config()
        self.config.wasm_bulk_memory = True
        self.config.wasm_simd = True
        self.config.wasm_memory64 = True
        self.engine = Engine(self.config)
        if isinstance(pipeline, bytes):
            wasm_bytes = pipeline
        else:
            with open(pipeline, 'rb') as fp:
                wasm_bytes = fp.read()
        self.linker = Linker(self.engine)
        self.linker.define_wasi()
        self.linker.allow_shadowing = True
        checksum = zlib.adler32(wasm_bytes)
        module_cache = _module_store_dir / Path(f'module-{checksum}')
        if module_cache.exists():
            try:
                self.module = Module.deserialize_file(self.engine, str(module_cache))
            except WasmtimeError:
                self.module = Module(self.engine, wasm_bytes)
                with module_cache.open('wb') as fp:
                    fp.write(self.module.serialize())
        else:
            self.module = Module(self.engine, wasm_bytes)
            with module_cache.open('wb') as fp:
                fp.write(self.module.serialize())

    def run(self, args: List[str], outputs: List[PipelineOutput]=[], inputs: List[PipelineInput]=[]) -> Tuple[PipelineOutput]:
        """Run the itk-wasm pipeline."""

        preopen_directories=set()
        for index, input_ in enumerate(inputs):
            if input_.type == InterfaceTypes.TextFile or input_.type == InterfaceTypes.BinaryFile:
                preopen_directories.add(str(PurePosixPath(input_.data.path).parent))
        for index, output in enumerate(outputs):
            if output.type == InterfaceTypes.TextFile or output.type == InterfaceTypes.BinaryFile:
                preopen_directories.add(str(PurePosixPath(output.data.path).parent))
        preopen_directories = list(preopen_directories)

        ri = RunInstance(self.engine, self.linker, self.module, args, preopen_directories)

        for index, input_ in enumerate(inputs):
            if input_.type == InterfaceTypes.TextStream:
                data_array = input_.data.data.encode()
                array_ptr = ri.set_input_array(data_array, index, 0)
                data_json = { "size": len(data_array), "data": f"data:application/vnd.itk.address,0:{array_ptr}" }
                ri.set_input_json(data_json, index)
            elif input_.type == InterfaceTypes.BinaryStream:
                data_array = input_.data.data
                array_ptr = ri.set_input_array(data_array, index, 0)
                data_json = { "size": len(data_array), "data": f"data:application/vnd.itk.address,0:{array_ptr}" }
                ri.set_input_json(data_json, index)
            elif input_.type == InterfaceTypes.TextFile:
                pass
            elif input_.type == InterfaceTypes.BinaryFile:
                pass
            elif input_.type == InterfaceTypes.Image:
                image = input_.data
                mv = array_like_to_bytes(image.data)
                data_ptr = ri.set_input_array(mv, index, 0)
                dv = array_like_to_bytes(image.direction)
                direction_ptr = ri.set_input_array(dv, index, 1)
                image_json = {
                    "imageType": asdict(image.imageType),
                    "name": image.name,
                    "origin": image.origin,
                    "spacing": image.spacing,
                    "direction": f"data:application/vnd.itk.address,0:{direction_ptr}",
                    "size": image.size,
                    "data": f"data:application/vnd.itk.address,0:{data_ptr}"
                }
                ri.set_input_json(image_json, index)
            elif input_.type == InterfaceTypes.Mesh:
                mesh = input_.data
                if mesh.numberOfPoints:
                    pv = array_like_to_bytes(mesh.points)
                else:
                    pv = bytes([])
                points_ptr = ri.set_input_array(pv, index, 0)
                if mesh.numberOfCells:
                    cv = array_like_to_bytes(mesh.cells)
                else:
                    cv = bytes([])
                cells_ptr = ri.set_input_array(cv, index, 1)
                if mesh.numberOfPointPixels:
                    pdv = array_like_to_bytes(mesh.pointData)
                else:
                    pdv = bytes([])
                point_data_ptr = ri.set_input_array(pdv, index, 2)
                if mesh.numberOfCellPixels:
                    cdv = array_like_to_bytes(mesh.cellData)
                else:
                    cdv = bytes([])
                cell_data_ptr = ri.set_input_array(cdv, index, 3)
                mesh_json = {
                    "meshType": asdict(mesh.meshType),
                    "name": mesh.name,

                    "numberOfPoints": mesh.numberOfPoints,
                    "points": f"data:application/vnd.itk.address,0:{points_ptr}",

                    "numberOfCells": mesh.numberOfCells,
                    "cells": f"data:application/vnd.itk.address,0:{cells_ptr}",
                    "cellBufferSize": mesh.cellBufferSize,

                    "numberOfPointPixels": mesh.numberOfPointPixels,
                    "pointData": f"data:application/vnd.itk.address,0:{point_data_ptr}",

                    "numberOfCellPixels": mesh.numberOfCellPixels,
                    "cellData": f"data:application/vnd.itk.address,0:{cell_data_ptr}",
                }
                ri.set_input_json(mesh_json, index)
            elif input_.type == InterfaceTypes.PolyData:
                polydata = input_.data
                if polydata.numberOfPoints:
                    pv = array_like_to_bytes(polydata.points)
                else:
                    pv = bytes([])
                points_ptr = ri.set_input_array(pv, index, 0)

                if polydata.verticesBufferSize:
                    pv = array_like_to_bytes(polydata.vertices)
                else:
                    pv = bytes([])
                vertices_ptr = ri.set_input_array(pv, index, 1)

                if polydata.linesBufferSize:
                    pv = array_like_to_bytes(polydata.lines)
                else:
                    pv = bytes([])
                lines_ptr = ri.set_input_array(pv, index, 2)

                if polydata.polygonsBufferSize:
                    pv = array_like_to_bytes(polydata.polygons)
                else:
                    pv = bytes([])
                polygons_ptr = ri.set_input_array(pv, index, 3)

                if polydata.triangleStripsBufferSize:
                    pv = array_like_to_bytes(polydata.triangleStrips)
                else:
                    pv = bytes([])
                triangleStrips_ptr = ri.set_input_array(pv, index, 4)

                if polydata.numberOfPointPixels:
                    pv = array_like_to_bytes(polydata.pointData)
                else:
                    pv = bytes([])
                pointData_ptr = ri.set_input_array(pv, index, 5)

                if polydata.numberOfCellPixels:
                    pv = array_like_to_bytes(polydata.cellData)
                else:
                    pv = bytes([])
                cellData_ptr = ri.set_input_array(pv, index, 6)

                polydata_json = {
                    "polyDataType": asdict(polydata.polyDataType),
                    "name": polydata.name,

                    "numberOfPoints": polydata.numberOfPoints,
                    "points": f"data:application/vnd.itk.address,0:{points_ptr}",

                    "verticesBufferSize": polydata.verticesBufferSize,
                    "vertices": f"data:application/vnd.itk.address,0:{vertices_ptr}",

                    "linesBufferSize": polydata.linesBufferSize,
                    "lines": f"data:application/vnd.itk.address,0:{lines_ptr}",

                    "polygonsBufferSize": polydata.polygonsBufferSize,
                    "polygons": f"data:application/vnd.itk.address,0:{polygons_ptr}",

                    "triangleStripsBufferSize": polydata.triangleStripsBufferSize,
                    "triangleStrips": f"data:application/vnd.itk.address,0:{triangleStrips_ptr}",

                    "numberOfPointPixels": polydata.numberOfPointPixels,
                    "pointData": f"data:application/vnd.itk.address,0:{pointData_ptr}",

                    "numberOfCellPixels": polydata.numberOfCellPixels,
                    "cellData": f"data:application/vnd.itk.address,0:{cellData_ptr}"
                }
                ri.set_input_json(polydata_json, index)
            elif input_.type == InterfaceTypes.JsonCompatible:
                data_array = json.dumps(input_.data).encode()
                array_ptr = ri.set_input_array(data_array, index, 0)
                data_json = { "size": len(data_array), "data": f"data:application/vnd.itk.address,0:{array_ptr}" }
                ri.set_input_json(data_json, index)
            else:
                raise ValueError(f'Unexpected/not yet supported input.type {input_.type}')

        return_code = ri.delayed_start()

        populated_outputs: List[PipelineOutput] = []
        if len(outputs) and return_code == 0:
            for index, output in enumerate(outputs):
                output_data = None
                if output.type == InterfaceTypes.TextStream:
                    data_ptr = ri.get_output_array_address(0, index, 0)
                    data_size = ri.get_output_array_size(0, index, 0)
                    data_array = ri.wasmtime_lift(data_ptr, data_size)
                    output_data = PipelineOutput(InterfaceTypes.TextStream, TextStream(data_array.decode()))
                elif output.type == InterfaceTypes.BinaryStream:
                    data_ptr = ri.get_output_array_address(0, index, 0)
                    data_size = ri.get_output_array_size(0, index, 0)
                    data_array = ri.wasmtime_lift(data_ptr, data_size)
                    output_data = PipelineOutput(InterfaceTypes.BinaryStream, BinaryStream(data_array))
                elif output.type == InterfaceTypes.TextFile:
                    output_data = PipelineOutput(InterfaceTypes.TextFile, TextFile(output.data.path))
                elif output.type == InterfaceTypes.BinaryFile:
                    output_data = PipelineOutput(InterfaceTypes.BinaryFile, BinaryFile(output.data.path))
                elif output.type == InterfaceTypes.Image:
                    image_json = ri.get_output_json(index)

                    image = Image(**image_json)

                    data_ptr = ri.get_output_array_address(0, index, 0)
                    data_size = ri.get_output_array_size(0, index, 0)
                    data_array = buffer_to_numpy_array(image.imageType.componentType, ri.wasmtime_lift(data_ptr, data_size))
                    shape = list(image.size)[::-1]
                    if image.imageType.components > 1:
                        shape.append(image.imageType.components)
                    image.data = data_array.reshape(tuple(shape))

                    direction_ptr = ri.get_output_array_address(0, index, 1)
                    direction_size = ri.get_output_array_size(0, index, 1)
                    direction_array = buffer_to_numpy_array(FloatTypes.Float64, ri.wasmtime_lift(direction_ptr, direction_size))
                    dimension = image.imageType.dimension
                    direction_array.shape = (dimension, dimension)
                    image.direction = direction_array

                    output_data = PipelineOutput(InterfaceTypes.Image, image)
                elif output.type == InterfaceTypes.Mesh:
                    mesh_json = ri.get_output_json(index)
                    mesh = Mesh(**mesh_json)

                    if mesh.numberOfPoints > 0:
                        data_ptr = ri.get_output_array_address(0, index, 0)
                        data_size = ri.get_output_array_size(0, index, 0)
                        mesh.points = buffer_to_numpy_array(mesh.meshType.pointComponentType, ri.wasmtime_lift(data_ptr, data_size))
                    else:
                        mesh.points =  buffer_to_numpy_array(mesh.meshType.pointComponentType, bytes([]))

                    if mesh.numberOfCells > 0:
                        data_ptr = ri.get_output_array_address(0, index, 1)
                        data_size = ri.get_output_array_size(0, index, 1)
                        mesh.cells = buffer_to_numpy_array(mesh.meshType.cellComponentType, ri.wasmtime_lift(data_ptr, data_size))
                    else:
                        mesh.cells =  buffer_to_numpy_array(mesh.meshType.cellComponentType, bytes([]))
                    if mesh.numberOfPointPixels > 0:
                        data_ptr = ri.get_output_array_address(0, index, 2)
                        data_size = ri.get_output_array_size(0, index, 2)
                        mesh.pointData = buffer_to_numpy_array(mesh.meshType.pointPixelComponentType, ri.wasmtime_lift(data_ptr, data_size))
                    else:
                        mesh.pointData =  buffer_to_numpy_array(mesh.meshType.pointPixelComponentType, bytes([]))

                    if mesh.numberOfCellPixels > 0:
                        data_ptr = ri.get_output_array_address(0, index, 3)
                        data_size = ri.get_output_array_size(0, index, 3)
                        mesh.cellData = buffer_to_numpy_array(mesh.meshType.cellPixelComponentType, ri.wasmtime_lift(data_ptr, data_size))
                    else:
                        mesh.cellData =  buffer_to_numpy_array(mesh.meshType.cellPixelComponentType, bytes([]))

                    output_data = PipelineOutput(InterfaceTypes.Mesh, mesh)
                elif output.type == InterfaceTypes.PolyData:
                    polydata_json = ri.get_output_json(index)
                    polydata = PolyData(**polydata_json)

                    if polydata.numberOfPoints > 0:
                        data_ptr = ri.get_output_array_address(0, index, 0)
                        data_size = ri.get_output_array_size(0, index, 0)
                        polydata.points = buffer_to_numpy_array(FloatTypes.Float32, ri.wasmtime_lift(data_ptr, data_size))
                    else:
                        polydata.points =  buffer_to_numpy_array(FloatTypes.Float32, bytes([]))

                    if polydata.verticesBufferSize > 0:
                        data_ptr = ri.get_output_array_address(0, index, 1)
                        data_size = ri.get_output_array_size(0, index, 1)
                        polydata.vertices = buffer_to_numpy_array(IntTypes.UInt32, ri.wasmtime_lift(data_ptr, data_size))
                    else:
                        polydata.vertices =  buffer_to_numpy_array(IntTypes.UInt32, bytes([]))

                    if polydata.linesBufferSize > 0:
                        data_ptr = ri.get_output_array_address(0, index, 2)
                        data_size = ri.get_output_array_size(0, index, 2)
                        polydata.lines = buffer_to_numpy_array(IntTypes.UInt32, ri.wasmtime_lift(data_ptr, data_size))
                    else:
                        polydata.lines =  buffer_to_numpy_array(IntTypes.UInt32, bytes([]))

                    if polydata.polygonsBufferSize > 0:
                        data_ptr = ri.get_output_array_address(0, index, 3)
                        data_size = ri.get_output_array_size(0, index, 3)
                        polydata.polygons = buffer_to_numpy_array(IntTypes.UInt32, ri.wasmtime_lift(data_ptr, data_size))
                    else:
                        polydata.polygons =  buffer_to_numpy_array(IntTypes.UInt32, bytes([]))

                    if polydata.triangleStripsBufferSize > 0:
                        data_ptr = ri.get_output_array_address(0, index, 4)
                        data_size = ri.get_output_array_size(0, index, 4)
                        polydata.triangleStrips = buffer_to_numpy_array(IntTypes.UInt32, ri.wasmtime_lift(data_ptr, data_size))
                    else:
                        polydata.triangleStrips =  buffer_to_numpy_array(IntTypes.UInt32, bytes([]))

                    if polydata.numberOfPointPixels > 0:
                        data_ptr = ri.get_output_array_address(0, index, 5)
                        data_size = ri.get_output_array_size(0, index, 5)
                        polydata.pointData = buffer_to_numpy_array(polydata.polyDataType.pointPixelComponentType, ri.wasmtime_lift(data_ptr, data_size))
                    else:
                        polydata.triangleStrips =  buffer_to_numpy_array(polydata.polyDataType.pointPixelComponentType, bytes([]))

                    if polydata.numberOfCellPixels > 0:
                        data_ptr = ri.get_output_array_address(0, index, 6)
                        data_size = ri.get_output_array_size(0, index, 6)
                        polydata.cellData = buffer_to_numpy_array(polydata.polyDataType.cellPixelComponentType, ri.wasmtime_lift(data_ptr, data_size))
                    else:
                        polydata.triangleStrips =  buffer_to_numpy_array(polydata.polyDataType.cellPixelComponentType, bytes([]))

                    output_data = PipelineOutput(InterfaceTypes.PolyData, polydata)
                elif output.type == InterfaceTypes.JsonCompatible:
                    data_ptr = ri.get_output_array_address(0, index, 0)
                    data_size = ri.get_output_array_size(0, index, 0)
                    data_array = ri.wasmtime_lift(data_ptr, data_size)
                    output_data = PipelineOutput(InterfaceTypes.JsonCompatible, json.loads(data_array.decode()))
                else:
                    raise ValueError(f'Unexpected/not yet supported output.type {output.type}')

                populated_outputs.append(output_data)

        ri.delayed_exit(return_code)

        # Should we be returning the return_code?
        return tuple(populated_outputs)
