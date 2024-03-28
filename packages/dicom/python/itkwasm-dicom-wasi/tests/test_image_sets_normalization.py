from itkwasm_dicom_wasi import image_sets_normalization

from .common import test_input_path, test_output_path


orientation_series = [
    test_input_path / "DicomImageOrientationTest" / "ImageOrientation.1.dcm",
    test_input_path / "DicomImageOrientationTest" / "ImageOrientation.2.dcm",
    test_input_path / "DicomImageOrientationTest" / "ImageOrientation.3.dcm",
]

mr_series = [
    test_input_path / "dicom-images" / "MR" / "1-001.dcm",
    test_input_path / "dicom-images" / "MR" / "1-002.dcm",
    test_input_path / "dicom-images" / "MR" / "1-003.dcm",
    test_input_path / "dicom-images" / "MR" / "1-004.dcm",
    test_input_path / "dicom-images" / "MR" / "1-005.dcm",
]


def test_one_series():
    assert orientation_series[0].exists()
    out_of_order = [
        orientation_series[1],
        orientation_series[2],
        orientation_series[0],
    ]
    image_sets = image_sets_normalization(out_of_order)
    print(image_sets)
    assert image_sets
    instances = list(image_sets[0]["Study"]["Series"].values())[0]["Instances"].values()
    sorted_files = [instance["ImageFrames"][0]["ID"] for instance in instances]
    print(sorted_files)
    assert all(
        file == str(path) for file, path in zip(sorted_files, orientation_series)
    )


def test_two_series():
    files = [
        orientation_series[1],
        orientation_series[2],
        orientation_series[0],
        mr_series[3],
        mr_series[0],
        mr_series[4],
        mr_series[2],
        mr_series[1],
    ]
    assert files[0].exists()
    image_sets = image_sets_normalization(files)
    assert len(image_sets) == 2


# def test_strange_ct():
#     files = [
#         test_input_path / "dicom-images" / "CT" / "1-1.dcm",
#         test_input_path / "dicom-images" / "CT" / "1-2.dcm",
#     ]
#     image_sets = image_sets_normalization(files)
#     assert image_sets
#     print(image_sets)
