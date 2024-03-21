# Generated file. Do not edit.

import os
from typing import Dict, Tuple, Optional, List, Any

from itkwasm import (
    environment_dispatch,
    Image,
)

async def compare_double_images_async(
    test_image: Image,
    baseline_images: List[Image] = [],
    difference_threshold: float = 0,
    radius_tolerance: int = 0,
    number_of_pixels_tolerance: int = 0,
    ignore_boundary_pixels: bool = False,
) -> Tuple[Any, Image, Image]:
    """Compare double pixel type images with a tolerance for regression testing.

    :param test_image: The input test image
    :type  test_image: Image

    :param baseline_images: Baseline images to compare against
    :type  baseline_images: Image

    :param difference_threshold: Intensity difference for pixels to be considered different.
    :type  difference_threshold: float

    :param radius_tolerance: Radius of the neighborhood around a pixel to search for similar intensity values.
    :type  radius_tolerance: int

    :param number_of_pixels_tolerance: Number of pixels that can be different before the test fails.
    :type  number_of_pixels_tolerance: int

    :param ignore_boundary_pixels: Ignore boundary pixels. Useful when resampling may have introduced difference pixel values along the image edge.
    :type  ignore_boundary_pixels: bool

    :return: Metrics for the baseline with the fewest number of pixels outside the tolerances.
    :rtype:  Any

    :return: Absolute difference image
    :rtype:  Image

    :return: Unsigned char, 2D difference image for rendering
    :rtype:  Image
    """
    func = environment_dispatch("itkwasm_compare_images", "compare_double_images_async")
    output = await func(test_image, baseline_images=baseline_images, difference_threshold=difference_threshold, radius_tolerance=radius_tolerance, number_of_pixels_tolerance=number_of_pixels_tolerance, ignore_boundary_pixels=ignore_boundary_pixels)
    return output
