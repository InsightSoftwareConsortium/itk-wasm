from pathlib import Path

import itk

from itkwasm import Mesh
from dataclasses import asdict
import numpy as np

def test_mesh():
    data = Path(__file__).absolute().parent.parent.parent.parent / "test" / "data" / "input" / "cow.vtk"
    itk_mesh = itk.meshread(data)

    itk_mesh_dict = itk.dict_from_mesh(itk_mesh)
    itkwasm_mesh = Mesh(**itk_mesh_dict)
    itkwasm_mesh_dict = asdict(itkwasm_mesh)
    itk_mesh_roundtrip = itk.mesh_from_dict(itkwasm_mesh_dict)
    itk_mesh_roundtrip_dict = itk.dict_from_mesh(itk_mesh_roundtrip)

    meshType = itk_mesh_dict["meshType"]
    meshType_roundtrip = itk_mesh_roundtrip_dict["meshType"]
    assert meshType["dimension"] == meshType_roundtrip["dimension"]

    assert meshType["pointComponentType"] == meshType_roundtrip["pointComponentType"]
    assert meshType["pointPixelComponentType"] == meshType_roundtrip["pointPixelComponentType"]
    assert meshType["pointPixelType"] == meshType_roundtrip["pointPixelType"]
    assert meshType["pointPixelComponents"] == meshType_roundtrip["pointPixelComponents"]

    assert meshType["cellComponentType"] == meshType_roundtrip["cellComponentType"]
    assert meshType["cellPixelComponentType"] == meshType_roundtrip["cellPixelComponentType"]
    assert meshType["cellPixelType"] == meshType_roundtrip["cellPixelType"]
    assert meshType["cellPixelComponents"] == meshType_roundtrip["cellPixelComponents"]

    assert itk_mesh_dict["name"] == itk_mesh_roundtrip_dict["name"]

    assert itk_mesh_dict["numberOfPoints"] == itk_mesh_roundtrip_dict["numberOfPoints"]
    assert np.array_equal(itk_mesh_dict["points"], itk_mesh_roundtrip_dict["points"])

    assert itk_mesh_dict["numberOfPointPixels"] == itk_mesh_roundtrip_dict["numberOfPointPixels"]
    assert np.array_equal(itk_mesh_dict["pointData"], itk_mesh_roundtrip_dict["pointData"])

    assert itk_mesh_dict["numberOfCells"] == itk_mesh_roundtrip_dict["numberOfCells"]
    assert np.array_equal(itk_mesh_dict["cells"], itk_mesh_roundtrip_dict["cells"])
    assert itk_mesh_dict["cellBufferSize"] == itk_mesh_roundtrip_dict["cellBufferSize"]

    assert itk_mesh_dict["numberOfCellPixels"] == itk_mesh_roundtrip_dict["numberOfCellPixels"]
    assert np.array_equal(itk_mesh_dict["cellData"], itk_mesh_roundtrip_dict["cellData"])
