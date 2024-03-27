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
    BinaryStream,
)

def compress_stringify(
    input: bytes,
    stringify: bool = False,
    compression_level: int = 3,
    data_url_prefix: str = "data:application/zstd;base64,",
) -> bytes:
    """Given a binary, compress and optionally base64 encode.

    :param input: Input binary
    :type  input: bytes

    :param stringify: Stringify the output
    :type  stringify: bool

    :param compression_level: Compression level, typically 1-9
    :type  compression_level: int

    :param data_url_prefix: dataURL prefix
    :type  data_url_prefix: str

    :return: Output compressed binary
    :rtype:  bytes
    """
    global _pipeline
    if _pipeline is None:
        _pipeline = Pipeline(file_resources('itkwasm_compress_stringify_wasi').joinpath(Path('wasm_modules') / Path('compress-stringify.wasi.wasm')))

    pipeline_outputs: List[PipelineOutput] = [
        PipelineOutput(InterfaceTypes.BinaryStream),
    ]

    pipeline_inputs: List[PipelineInput] = [
        PipelineInput(InterfaceTypes.BinaryStream, BinaryStream(input)),
    ]

    args: List[str] = ['--memory-io',]
    # Inputs
    args.append('0')
    # Outputs
    output_name = '0'
    args.append(output_name)

    # Options
    input_count = len(pipeline_inputs)
    if stringify:
        args.append('--stringify')

    if compression_level:
        args.append('--compression-level')
        args.append(str(compression_level))

    if data_url_prefix:
        args.append('--data-url-prefix')
        args.append(str(data_url_prefix))


    outputs = _pipeline.run(args, pipeline_outputs, pipeline_inputs)

    result = outputs[0].data.data
    return result

