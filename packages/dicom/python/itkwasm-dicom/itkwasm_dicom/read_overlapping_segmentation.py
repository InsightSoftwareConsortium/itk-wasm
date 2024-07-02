# Generated file. Do not edit.

import os
from typing import Dict, Tuple, Optional, List, Any

from itkwasm import (
    environment_dispatch,
    BinaryFile,
    Image,
)

def read_overlapping_segmentation(
    dicom_file: os.PathLike,
    merge_segments: bool = False,
) -> Tuple[Image, Any]:
    """Read DICOM segmentation objects

    :param dicom_file: Input DICOM file
    :type  dicom_file: os.PathLike

    :param merge_segments: Merge segments into a single image
    :type  merge_segments: bool

    :return: dicom segmentation object as an image
    :rtype:  Image

    :return: Output overlay information
    :rtype:  Any
    """
    func = environment_dispatch("itkwasm_dicom", "read_overlapping_segmentation")
    output = func(dicom_file, merge_segments=merge_segments)
    return output
