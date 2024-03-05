from pathlib import Path


def test_sort_dicom_series():
    from itkwasm_dicom_wasi import sort_dicom_series

    file_name = "ImageOrientation.1.dcm"
    test_file_path = Path(
        "..", "..", "test", "data", "input", "DicomImageOrientationTest", file_name
    )

    assert test_file_path.exists()

    output_text = sort_dicom_series([test_file_path])
    assert output_text
