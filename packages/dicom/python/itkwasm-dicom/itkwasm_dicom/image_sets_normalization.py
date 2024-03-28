# Generated file. Do not edit.

import os
from typing import Dict, Tuple, Optional, List, Any

from itkwasm import (
    environment_dispatch,
    BinaryFile,
)

def image_sets_normalization(
    files: List[os.PathLike] = [],
) -> Any:
    """Group DICOM files into image sets

    :param files: DICOM files
    :type  files: os.PathLike

    :return: Image sets JSON
    :rtype:  Any
    """
    func = environment_dispatch("itkwasm_dicom", "image_sets_normalization")
    output = func(files=files)
    return output
