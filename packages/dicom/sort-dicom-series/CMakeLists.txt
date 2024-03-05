find_package(ITK REQUIRED
  COMPONENTS ITKCommon
    ITKGDCM
    WebAssemblyInterface
)
include(${ITK_USE_FILE})

add_executable(sort-dicom-series sort-dicom-series.cxx)
target_link_libraries(sort-dicom-series PUBLIC ${ITK_LIBRARIES})

enable_testing()

add_test(NAME sort-dicom-series-help COMMAND sort-dicom-series --help)

add_test(NAME sort-dicom-series-smoke
  COMMAND sort-dicom-series --files
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/DicomImageOrientationTest/ImageOrientation.1.dcm
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/DicomImageOrientationTest/ImageOrientation.2.dcm
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/DicomImageOrientationTest/ImageOrientation.3.dcm
)
