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
    assert image_sets
    sorted_files = list(image_sets.values())[0]
    assert sorted_files == [
        str(files[1]),
        str(files[2]),
        str(files[0]),
    ]

def test_two_series():
    files = [
        test_input_path / "DicomImageOrientationTest" / "ImageOrientation.3.dcm",
        test_input_path / "DicomImageOrientationTest" / "ImageOrientation.1.dcm",
        test_input_path / "DicomImageOrientationTest" / "ImageOrientation.2.dcm",
        test_input_path / "dicom-images" / "MR" / "1-001.dcm",
        test_input_path / "dicom-images" / "MR" / "1-002.dcm",
        test_input_path / "dicom-images" / "MR" / "1-003.dcm",
        test_input_path / "dicom-images" / "MR" / "1-004.dcm",
        test_input_path / "dicom-images" / "MR" / "1-005.dcm",
    ]
    assert files[0].exists()
    image_sets = image_sets_normalization(files)
    assert image_sets
    assert len(image_sets.keys()) == 2

def test_strange_ct():
    files = [
        test_input_path / "dicom-images" / "CT" / "1-1.dcm",
        test_input_path / "dicom-images" / "CT" / "1-2.dcm",
    ]
    image_sets = image_sets_normalization(files)
    assert image_sets
    print(image_sets)