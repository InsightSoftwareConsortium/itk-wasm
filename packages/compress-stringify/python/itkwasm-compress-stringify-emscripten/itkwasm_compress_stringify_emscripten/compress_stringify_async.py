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
    BinaryStream,
)

async def compress_stringify_async(
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
    js_module = await js_package.js_module
    web_worker = js_resources.web_worker

    kwargs = {}
    if stringify:
        kwargs["stringify"] = to_js(stringify)
    if compression_level:
        kwargs["compressionLevel"] = to_js(compression_level)
    if data_url_prefix:
        kwargs["dataUrlPrefix"] = to_js(data_url_prefix)

    outputs = await js_module.compressStringify(to_js(input), webWorker=web_worker, noCopy=True, **kwargs)

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
