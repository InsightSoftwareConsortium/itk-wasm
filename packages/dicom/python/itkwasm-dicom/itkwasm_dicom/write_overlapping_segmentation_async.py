# Generated file. Do not edit.

import os
from typing import Dict, Tuple, Optional, List, Any

from itkwasm import (
    environment_dispatch,
    Image,
    BinaryFile,
)

async def write_overlapping_segmentation_async(
    seg_image: Image,
    meta_info: Any,
    output_dicom_file: str,
    ref_dicom_series: List[os.PathLike] = [],
    skip_empty_slices: bool = False,
    use_labelid_as_segmentnumber: bool = False,
) -> os.PathLike:
    """Write DICOM segmentation object

    :param seg_image: dicom segmentation object as an image
    :type  seg_image: Image

    :param meta_info: JSON file containing the meta-information that describesthe measurements to be encoded. See DCMQI documentation for details.
    :type  meta_info: Any

    :param output_dicom_file: File name of the DICOM SEG object that will store theresult of conversion.
    :type  output_dicom_file: str

    :param ref_dicom_series: List of DICOM files that correspond to the originalimage that was segmented.
    :type  ref_dicom_series: os.PathLike

    :param skip_empty_slices: Skip empty slices while encoding segmentation image.By default, empty slices will not be encoded, resulting in a smaller output file size.
    :type  skip_empty_slices: bool

    :param use_labelid_as_segmentnumber: Use label IDs from ITK images asSegment Numbers in DICOM. Only works if label IDs are consecutively numbered starting from 1, otherwise conversion will fail.
    :type  use_labelid_as_segmentnumber: bool
    """
    func = environment_dispatch("itkwasm_dicom", "write_overlapping_segmentation_async")
    output = await func(seg_image, meta_info, output_dicom_file, ref_dicom_series=ref_dicom_series, skip_empty_slices=skip_empty_slices, use_labelid_as_segmentnumber=use_labelid_as_segmentnumber)
    return output
