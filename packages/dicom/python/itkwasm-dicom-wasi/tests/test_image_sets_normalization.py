# Generated file. To retain edits, remove this comment.

from itkwasm_dicom_wasi import image

from .common import test_input_path, test_output_path

def test_sort_dicom_series():
    from itkwasm_dicom_wasi import image_sets_normalization

    test_file_path = test_input_path / "DicomImageOrientationTest" / "ImageOrientation.1.dcm"

    assert test_file_path.exists()

    output_text = image_sets_normalization([test_file_path])
    assert output_text
    