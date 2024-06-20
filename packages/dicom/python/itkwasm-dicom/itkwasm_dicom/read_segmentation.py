# Generated file. Do not edit.

import os
from typing import Dict, Tuple, Optional, List, Any

from itkwasm import (
    environment_dispatch,
    BinaryFile,
    Image,
)

def read_segmentation(
    dicom_file: os.PathLike,
) -> Tuple[Image, Any]:
    """Read DICOM segmentation objects

    :param dicom_file: Input DICOM file
    :type  dicom_file: os.PathLike

    :return: dicom segmentation object as an image
    :rtype:  Image

    :return: Output overlay information
    :rtype:  Any
    """
    func = environment_dispatch("itkwasm_dicom", "read_segmentation")
    output = func(dicom_file)
    return output
