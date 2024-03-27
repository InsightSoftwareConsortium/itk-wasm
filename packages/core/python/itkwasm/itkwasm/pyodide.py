from dataclasses import dataclass, asdict
from typing import Optional

from .image import Image, ImageType
from .pointset import PointSet, PointSetType
from .mesh import Mesh, MeshType
from .polydata import PolyData, PolyDataType
from .binary_file import BinaryFile
from .binary_stream import BinaryStream
from .text_file import TextFile
from .text_stream import TextStream
from .float_types import FloatTypes
from .int_types import IntTypes
from .json_compatible import JsonCompatible
from .to_numpy_array import buffer_to_numpy_array

@dataclass
class JsPackageConfig:
    module_url: str
    pipelines_base_url: Optional[str] = None
    pipeline_worker_url: Optional[str] = None

class JsPackage:
    def __init__(self, config: JsPackageConfig):
        self._config = config
        self._js_module = None

    @property
    def config(self):
        return self._config

    @config.setter
    def config(self, value):
        self._config = value

    @property
    async def js_module(self):
        if self._js_module is not None:
            return self._js_module
        from pyodide.code import run_js
        js_module = await run_js(f"import('{self._config.module_url}')")
        if self._config.pipelines_base_url is not None:
            js_module.setPipelinesBaseUrl(self._config.pipelines_base_url)
        if self._config.pipeline_worker_url is not None:
            js_module.setPipelineWorkerUrl(self._config.pipeline_worker_url)
        self._js_module = js_module
        return js_module

class JsResources:
    def __init__(self):
        self._web_worker = None

    @property
    def web_worker(self):
        return self._web_worker

    @web_worker.setter
    def web_worker(self, value):
        self._web_worker = value

js_resources = JsResources()

def to_py(js_proxy):
    import pyodide
    if hasattr(js_proxy, 'constructor') and js_proxy.constructor.name == "Uint8Array":
        return js_proxy.to_bytes()
    elif isinstance(js_proxy, pyodide.ffi.JsArray):
        return [to_py(value) for value in js_proxy]
    elif hasattr(js_proxy, "imageType"):
        image_dict = js_proxy.to_py()
        image_type = ImageType(**image_dict['imageType'])
        image_dict['imageType'] = image_type
        dimension = image_type.dimension
        component_type = image_type.componentType
        image_dict['direction'] = buffer_to_numpy_array(str(FloatTypes.Float64), image_dict['direction']).reshape((dimension, dimension))
        shape = list(image_dict['size'])[::-1]
        if image_type.components > 1:
            shape.append(image_type.components)
        if image_dict['data'] is not None:
            image_dict['data'] = buffer_to_numpy_array(component_type, image_dict['data']).reshape(tuple(shape))
        return Image(**image_dict)
    elif hasattr(js_proxy, "pointSetType"):
        point_set_dict = js_proxy.to_py()
        point_set_type = PointSetType(**point_set_dict['pointSetType'])
        point_set_dict['pointSetType'] = point_set_type
        dimension = point_set_type.dimension
        point_component_type = point_set_type.pointComponentType
        point_pixel_component_type = point_set_type.pointPixelComponentType
        if point_set_dict['points'] is not None:
            point_set_dict['points'] = buffer_to_numpy_array(point_component_type, point_set_dict['points']).reshape((-1, dimension))
        if point_set_dict['pointData'] is not None:
            point_set_dict['pointData'] = buffer_to_numpy_array(point_pixel_component_type, point_set_dict['pointData'])
        return PointSet(**point_set_dict)
    elif hasattr(js_proxy, "meshType"):
        mesh_dict = js_proxy.to_py()
        mesh_type = MeshType(**mesh_dict['meshType'])
        mesh_dict['meshType'] = mesh_type
        dimension = mesh_type.dimension
        point_component_type = mesh_type.pointComponentType
        point_pixel_component_type = mesh_type.pointPixelComponentType
        cell_component_type = mesh_type.cellComponentType
        cell_pixel_component_type = mesh_type.cellPixelComponentType
        if mesh_dict['points'] is not None:
            mesh_dict['points'] = buffer_to_numpy_array(point_component_type, mesh_dict['points']).reshape((-1, dimension))
        if mesh_dict['pointData'] is not None:
            mesh_dict['pointData'] = buffer_to_numpy_array(point_pixel_component_type, mesh_dict['pointData'])
        if mesh_dict['cells'] is not None:
            mesh_dict['cells'] = buffer_to_numpy_array(cell_component_type, mesh_dict['cells'])
        if mesh_dict['cellData'] is not None:
            mesh_dict['cellData'] = buffer_to_numpy_array(cell_pixel_component_type, mesh_dict['cellData'])
        return Mesh(**mesh_dict)
    elif hasattr(js_proxy, "polyDataType"):
        polydata_dict = js_proxy.to_py()
        polydata_type = PolyDataType(**polydata_dict['polyDataType'])
        polydata_dict['polyDataType'] = polydata_type
        point_pixel_component_type = polydata_type.pointPixelComponentType
        cell_pixel_component_type = polydata_type.cellPixelComponentType
        if polydata_dict['points'] is not None:
            polydata_dict['points'] = buffer_to_numpy_array(str(FloatTypes.Float32), polydata_dict['points']).reshape((-1, 3))
        if polydata_dict['vertices'] is not None:
            polydata_dict['vertices'] = buffer_to_numpy_array(str(IntTypes.UInt32), polydata_dict['vertices'])
        if polydata_dict['lines'] is not None:
            polydata_dict['lines'] = buffer_to_numpy_array(str(IntTypes.UInt32), polydata_dict['lines'])
        if polydata_dict['polygons'] is not None:
            polydata_dict['polygons'] = buffer_to_numpy_array(str(IntTypes.UInt32), polydata_dict['polygons'])
        if polydata_dict['triangleStrips'] is not None:
            polydata_dict['triangleStrips'] = buffer_to_numpy_array(str(IntTypes.UInt32), polydata_dict['triangleStrips'])
        if polydata_dict['pointData'] is not None:
            polydata_dict['pointData'] = buffer_to_numpy_array(point_pixel_component_type, polydata_dict['pointData'])
        if polydata_dict['cellData'] is not None:
            polydata_dict['cellData'] = buffer_to_numpy_array(cell_pixel_component_type, polydata_dict['cellData'])
        return PolyData(**polydata_dict)
    elif hasattr(js_proxy, "path") and hasattr(js_proxy, "data") and isinstance(js_proxy.data, str):
        with open(js_proxy.path, 'w') as fp:
            fp.write(js_proxy.data)
        return TextFile(path=js_proxy.path)
    elif hasattr(js_proxy, "path") and hasattr(js_proxy, "data"):
        with open(js_proxy.path, 'wb') as fp:
            js_proxy.data.to_file(fp)
        return BinaryFile(path=js_proxy.path)
    elif hasattr(js_proxy, "data") and isinstance(js_proxy.data, str):
        text_stream_dict = js_proxy.to_py()
        return TextStream(**text_stream_dict)
    elif hasattr(js_proxy, "data"):
        binary_stream_dict = js_proxy.to_py()
        binary_stream_dict['data'] = bytes(binary_stream_dict['data'])
        return BinaryStream(**binary_stream_dict)
    elif isinstance(js_proxy, pyodide.ffi.JsProxy):
        return js_proxy.to_py()
    # int, etc
    return js_proxy

def to_js(py, **kwargs):
    import pyodide
    import js
    if isinstance(py, list):
        js_array = pyodide.ffi.to_js([])
        for value in py:
            js_array.append(to_js(value))
        return js_array
    elif isinstance(py, Image):
        image_dict = asdict(py)
        image_dict['direction'] = image_dict['direction'].ravel()
        if image_dict['data'] is not None:
            image_dict['data'] = image_dict['data'].ravel()
        if 'metadata' in image_dict:
            image_dict['metadata'] = pyodide.ffi.to_js(image_dict['metadata'], dict_converter=js.Map.new)
        else:
            image_dict['metadata'] = pyodide.ffi.to_js(dict(), dict_converter=js.Map.new)
        return pyodide.ffi.to_js(image_dict, dict_converter=js.Object.fromEntries)
    elif isinstance(py, PointSet):
        point_set_dict = asdict(py)
        if point_set_dict['points'] is not None:
            point_set_dict['points'] = point_set_dict['points'].ravel()
        if point_set_dict['pointData'] is not None:
            point_set_dict['pointData'] = point_set_dict['pointData'].ravel()
        return pyodide.ffi.to_js(point_set_dict, dict_converter=js.Object.fromEntries)
    elif isinstance(py, Mesh):
        mesh_dict = asdict(py)
        if mesh_dict['points'] is not None:
            mesh_dict['points'] = mesh_dict['points'].ravel()
        if mesh_dict['pointData'] is not None:
            mesh_dict['pointData'] = mesh_dict['pointData'].ravel()
        if mesh_dict['cells'] is not None:
            mesh_dict['cells'] = mesh_dict['cells'].ravel()
        if mesh_dict['cellData'] is not None:
            mesh_dict['cellData'] = mesh_dict['cellData'].ravel()
        return pyodide.ffi.to_js(mesh_dict, dict_converter=js.Object.fromEntries)
    elif isinstance(py, PolyData):
        polydata_dict = asdict(py)
        if polydata_dict['points'] is not None:
            polydata_dict['points'] = polydata_dict['points'].ravel()
        if polydata_dict['vertices'] is not None:
            polydata_dict['vertices'] = polydata_dict['vertices'].ravel()
        if polydata_dict['lines'] is not None:
            polydata_dict['lines'] = polydata_dict['lines'].ravel()
        if polydata_dict['polygons'] is not None:
            polydata_dict['polygons'] = polydata_dict['polygons'].ravel()
        if polydata_dict['triangleStrips'] is not None:
            polydata_dict['triangleStrips'] = polydata_dict['triangleStrips'].ravel()
        if polydata_dict['pointData'] is not None:
            polydata_dict['pointData'] = polydata_dict['pointData'].ravel()
        if polydata_dict['cellData'] is not None:
            polydata_dict['cellData'] = polydata_dict['cellData'].ravel()
        return pyodide.ffi.to_js(polydata_dict, dict_converter=js.Object.fromEntries)
    elif isinstance(py, TextStream):
        text_stream_dict = asdict(py)
        return pyodide.ffi.to_js(text_stream_dict, dict_converter=js.Object.fromEntries)
    elif isinstance(py, BinaryStream):
        binary_stream_dict = asdict(py)
        return pyodide.ffi.to_js(binary_stream_dict, dict_converter=js.Object.fromEntries)
    elif isinstance(py, BinaryFile):
        binary_file_dict = asdict(py)
        with open(py.path, 'rb') as fp:
            data = fp.read()
        binary_file_dict['data'] = data
        return pyodide.ffi.to_js(binary_file_dict, dict_converter=js.Object.fromEntries)
    elif isinstance(py, TextFile):
        text_file_dict = asdict(py)
        with open(py.path, 'r') as fp:
            data = fp.read()
        text_file_dict['data'] = data
        return pyodide.ffi.to_js(text_file_dict, dict_converter=js.Object.fromEntries)

    return pyodide.ffi.to_js(py, **kwargs)
