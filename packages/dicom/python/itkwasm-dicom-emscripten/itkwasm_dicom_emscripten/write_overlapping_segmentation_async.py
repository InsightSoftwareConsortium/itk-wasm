# Generated file. To retain edits, remove this comment.

from pathlib import Path
import os
from typing import Dict, Tuple, Optional, List, Any

from .js_package import js_package

from itkwasm.pyodide import (
    to_js,
    to_py,
    js_resources
)
from itkwasm import (
    InterfaceTypes,
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
    js_module = await js_package.js_module
    web_worker = js_resources.web_worker

    kwargs = {}
    if ref_dicom_series is not None:
        kwargs["refDicomSeries"] = to_js(BinaryFile(ref_dicom_series))
    if skip_empty_slices:
        kwargs["skipEmptySlices"] = to_js(skip_empty_slices)
    if use_labelid_as_segmentnumber:
        kwargs["useLabelidAsSegmentnumber"] = to_js(use_labelid_as_segmentnumber)

    outputs = await js_module.writeOverlappingSegmentation(to_js(seg_image), to_js(meta_info), to_js(output_dicom_file), webWorker=web_worker, noCopy=True, **kwargs)

    output_web_worker = None
    output_list = []
    outputs_object_map = outputs.as_object_map()
    for output_name in outputs.object_keys():
        if output_name == 'webWorker':
            output_web_worker = outputs_object_map[output_name]
        else:
            output_list.append(to_py(outputs_object_map[output_name]))

    js_resources.web_worker = output_web_worker

    if len(output_list) == 1:
        return output_list[0]
    return tuple(output_list)
