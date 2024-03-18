from itkwasm_dicom_wasi import image_sets_normalization

from .common import test_input_path, test_output_path


def test_one_series():
    files = [
        test_input_path / "DicomImageOrientationTest" / "ImageOrientation.3.dcm",
        test_input_path / "DicomImageOrientationTest" / "ImageOrientation.1.dcm",
        test_input_path / "DicomImageOrientationTest" / "ImageOrientation.2.dcm",
    ]

    assert files[0].exists()

    image_sets = image_sets_normalization(files)
    print(image_sets)
    # assert image_sets

    assert image_sets == [
        str(files[1]),
        str(files[2]),
        str(files[0]),
    ]

# def test_two_series():
#     files = [
#         test_input_path / "DicomImageOrientationTest" / "ImageOrientation.3.dcm",
#         test_input_path / "DicomImageOrientationTest" / "ImageOrientation.1.dcm",
#         test_input_path / "DicomImageOrientationTest" / "ImageOrientation.2.dcm",
#         test_input_path / "dicom-images" / "CT" / "1-1.dcm",
#         test_input_path / "dicom-images" / "CT" / "1-2.dcm",
#     ]

#     assert files[0].exists()

#     image_sets = image_sets_normalization(files)
#     assert image_sets