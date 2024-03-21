from dataclasses import asdict
import json

from itkwasm import Image, FloatTypes, Mesh, PolyData, array_like_to_bytes, buffer_to_numpy_array

from .compress_stringify import compress_stringify
from .parse_string_decompress import parse_string_decompress

def image_to_json(image: Image) -> str:
    """Convert an image to a JSON string

    :param image: Input image
    :type  image: itkwasm.Image

    :return: JSON string
    :rtype:  str
    """
    image_dict = asdict(image)
    level = 5

    direction_bytes = array_like_to_bytes(image_dict["direction"])
    image_dict["direction"] = compress_stringify(direction_bytes, compression_level=level, stringify=True).decode()

    if image_dict["data"] is not None:
        data_bytes = array_like_to_bytes(image_dict["data"])
        image_dict["data"] = compress_stringify(data_bytes, compression_level=level, stringify=True).decode()

    json_str = json.dumps(image_dict)

    return json_str

def json_to_image(image_json: str) -> Image:
    """Convert a JSON string to an image

    :param image_json: Input JSON string
    :type  image_json: str

    :return: Output image
    :rtype:  itkwasm.Image
    """
    image_dict = json.loads(image_json)
    image_type = image_dict["imageType"]
    dimension = image_type["dimension"]

    direction_bytes = parse_string_decompress(image_dict["direction"].encode(), parse_string=True)
    image_dict["direction"] = buffer_to_numpy_array(FloatTypes.Float64, direction_bytes).reshape((dimension, dimension))

    if image_dict["data"] is not None:
        data_bytes = parse_string_decompress(image_dict["data"].encode(), parse_string=True)
        data_array = buffer_to_numpy_array(image_type["componentType"], data_bytes)
        shape = list(image_dict["size"])[::-1]
        if image_type["components"] > 1:
            shape.append(image_type["components"])
        image_dict["data"] = data_array.reshape(tuple(shape))

    image = Image(**image_dict)

    return image
