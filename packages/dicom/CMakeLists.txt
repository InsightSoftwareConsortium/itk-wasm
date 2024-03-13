cmake_minimum_required(VERSION 3.16)
project(itkwasm-dicom)

set(CMAKE_CXX_STANDARD 17)

add_subdirectory(gdcm)
add_subdirectory(dcmtk)

enable_testing()

add_test(NAME image-sets-normalization-help COMMAND image-sets-normalization --help)

add_test(NAME image-sets-normalization-smoke
  COMMAND image-sets-normalization image-sets.json --files
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/DicomImageOrientationTest/ImageOrientation.1.dcm
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/DicomImageOrientationTest/ImageOrientation.2.dcm
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/DicomImageOrientationTest/ImageOrientation.3.dcm
)