cmake_minimum_required(VERSION 3.16)
project(itkwasm-dicom)

set(CMAKE_CXX_STANDARD 17)

add_subdirectory(gdcm)
add_subdirectory(dcmtk)

find_package(ITK REQUIRED
  COMPONENTS ITKCommon
    ITKGDCM
    WebAssemblyInterface
  )
include(${ITK_USE_FILE})

add_executable(sort-dicom-series sort-dicom-series.cxx)
target_link_libraries(sort-dicom-series PUBLIC ${ITK_LIBRARIES})
