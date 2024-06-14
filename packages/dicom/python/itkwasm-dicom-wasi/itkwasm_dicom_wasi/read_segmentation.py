# Generated file. To retain edits, remove this comment.

from pathlib import Path, PurePosixPath
import os
from typing import Dict, Tuple, Optional, List, Any

from importlib_resources import files as file_resources

_pipeline = None

from itkwasm import (
    InterfaceTypes,
    PipelineOutput,
    PipelineInput,
    Pipeline,
    BinaryFile,
    Image,
)

def read_segmentation(
    dicom_file: os.PathLike,
    merge_segments: bool = False,
) -> Image:
    """Read DICOM segmentation objects

    :param dicom_file: Input DICOM file
    :type  dicom_file: os.PathLike

    :param merge_segments: Merge segments into a single image
    :type  merge_segments: bool

    :return: dicom segmentation object as an image
    :rtype:  Image
    """
    global _pipeline
    if _pipeline is None:
        _pipeline = Pipeline(file_resources('itkwasm_dicom_wasi').joinpath(Path('wasm_modules') / Path('read-segmentation.wasi.wasm')))

    pipeline_outputs: List[PipelineOutput] = [
        PipelineOutput(InterfaceTypes.Image),
    ]

    pipeline_inputs: List[PipelineInput] = [
        PipelineInput(InterfaceTypes.BinaryFile, BinaryFile(PurePosixPath(dicom_file))),
    ]

    args: List[str] = ['--memory-io',]
    # Inputs
    if not Path(dicom_file).exists():
        raise FileNotFoundError("dicom_file does not exist")
    args.append(str(PurePosixPath(dicom_file)))
    # Outputs
    outputImage_name = '0'
    args.append(outputImage_name)

    # Options
    input_count = len(pipeline_inputs)
    if merge_segments:
        args.append('--merge-segments')


    outputs = _pipeline.run(args, pipeline_outputs, pipeline_inputs)

    result = outputs[0].data
    return result

