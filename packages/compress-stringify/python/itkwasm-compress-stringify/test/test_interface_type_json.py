from pathlib import Path

from itkwasm_compress_stringify import compress_stringify, parse_string_decompress, image_to_json, json_to_image

def test_image_to_json():
    from itkwasm_image_io import read_image
    from itkwasm_compare_images import compare_images

    image_filepath = Path(__file__).parent / ".." / ".." / ".." / "test" / "data" / "input" / "cthead1.png"
    image = read_image(image_filepath)

    image_json = image_to_json(image)
    json_image = json_to_image(image_json)
    almost_equal, _, _ = compare_images(image, [json_image,])
    assert almost_equal