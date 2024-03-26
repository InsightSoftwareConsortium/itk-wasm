from pathlib import Path

import itk

from itkwasm import Image
from dataclasses import asdict
import numpy as np

def test_image():
    data = Path(__file__).absolute().parent.parent.parent.parent / "test" / "data" / "input" / "cthead1.png"
    itk_image = itk.imread(data, itk.UC)
    itk_image_dict = itk.dict_from_image(itk_image)
    itkwasm_image = Image(**itk_image_dict)
    itkwasm_image_dict = asdict(itkwasm_image)
    itk_image_roundtrip = itk.image_from_dict(itkwasm_image_dict)
    difference = np.sum(itk.comparison_image_filter(itk_image, itk_image_roundtrip))
    assert difference == 0.0

def test_image_defaults():
    image = Image()

    assert image.imageType.dimension == 2
    assert image.imageType.componentType == 'uint8'
    assert image.imageType.pixelType == 'Scalar'
    assert image.imageType.components == 1

    assert image.name == "Image"
    assert image.origin[0] == 0.0
    assert image.origin[1] == 0.0
    assert image.spacing[0] == 1.0
    assert image.spacing[1] == 1.0
    assert np.array_equal(image.direction, np.eye(2).astype(np.float64))

    assert image.size[0] == 1
    assert image.size[1] == 1

    assert isinstance(image.metadata, dict)
    assert image.data == None
