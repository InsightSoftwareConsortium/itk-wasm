from itkwasm_dicom_wasi import image_sets_normalization

from .common import test_input_path, test_output_path


def test_image_sets_normalization():
    files = [
        test_input_path / "DicomImageOrientationTest" / "ImageOrientation.1.dcm",
        test_input_path / "DicomImageOrientationTest" / "ImageOrientation.2.dcm",
        test_input_path / "DicomImageOrientationTest" / "ImageOrientation.3.dcm",
    ]

    assert files[0].exists()

    output_text = image_sets_normalization(files)
    assert output_text
