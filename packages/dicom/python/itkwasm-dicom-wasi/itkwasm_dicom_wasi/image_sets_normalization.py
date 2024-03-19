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
    global _pipeline
    if _pipeline is None:
        _pipeline = Pipeline(file_resources('itkwasm_dicom_wasi').joinpath(Path('wasm_modules') / Path('image-sets-normalization.wasi.wasm')))

    pipeline_outputs: List[PipelineOutput] = [
        PipelineOutput(InterfaceTypes.JsonCompatible),
    ]

    pipeline_inputs: List[PipelineInput] = [
    ]

    args: List[str] = ['--memory-io',]
    # Inputs
    # Outputs
    image_sets_metadata_name = '0'
    args.append(image_sets_metadata_name)

    # Options
    input_count = len(pipeline_inputs)
    if len(files) < 1:
       raise ValueError('"files" kwarg must have a length > 1')
    if len(files) > 0:
        args.append('--files')
        for value in files:
            input_file = str(PurePosixPath(value))
            pipeline_inputs.append(PipelineInput(InterfaceTypes.BinaryFile, BinaryFile(value)))
            args.append(input_file)


    outputs = _pipeline.run(args, pipeline_outputs, pipeline_inputs)

    result = outputs[0].data
    return result

