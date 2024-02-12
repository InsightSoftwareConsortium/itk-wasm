find_package(ITK REQUIRED
  COMPONENTS
    ITKDCMTK
    WebAssemblyInterface
  )
include(${ITK_USE_FILE})

if(POLICY CMP0077)
  set(CMAKE_POLICY_DEFAULT_CMP0077 NEW)
endif()

include(FetchContent)
# DCMQI
set(DCMQI_GIT_REPOSITORY "https://github.com/jadh4v/dcmqi.git")
set(DCMQI_GIT_TAG        "0938c3341b7b259657aff4485e9178b95385afb7")
set(DCMQI_SUPERBUILD OFF)
set(DCMQI_BUILD_SLICER_EXTENSION OFF)
set(DCMQI_BUILD_APPS OFF)
set(DCMQI_BUILD_DOC OFF)
set(BUILD_TESTING OFF)
set(DCMTK_DIR ${ITK_DIR}/Modules/ThirdParty/DCMTK/ITKDCMTK_ExtProject-build)
FetchContent_Declare(
  dcmqi_lib
  GIT_REPOSITORY ${DCMQI_GIT_REPOSITORY}
  GIT_TAG ${DCMQI_GIT_TAG}
)

FetchContent_MakeAvailable(dcmqi_lib)

set(DCMQI_INCLUDE_DIR "${dcmqi_lib_SOURCE_DIR}/include")

add_executable(structured-report-to-text structured-report-to-text.cxx)
target_link_libraries(structured-report-to-text PUBLIC ${ITK_LIBRARIES})

add_executable(apply-presentation-state-to-image apply-presentation-state-to-image.cxx)
target_link_libraries(apply-presentation-state-to-image PUBLIC cpp-base64 ${ITK_LIBRARIES})
#add_test(NAME apply-presentation-state-to-image-test
  #COMMAND apply-presentation-state-to-image
    #${CMAKE_CURRENT_SOURCE_DIR}/../test/data/input/csps-input-image.dcm
    #${CMAKE_CURRENT_SOURCE_DIR}/../test/data/input/csps-input-pstate.dcm
    #${CMAKE_CURRENT_BINARY_DIR}/apply-presentation-state-to-image-p-state.json
    #${CMAKE_CURRENT_BINARY_DIR}/apply-presentation-state-to-image-output-image.iwi.cbor
    #)

add_executable(structured-report-to-html structured-report-to-html.cxx)
target_link_libraries(structured-report-to-html PUBLIC ${ITK_LIBRARIES})

add_executable(read-dicom-encapsulated-pdf read-dicom-encapsulated-pdf.cxx)
target_link_libraries(read-dicom-encapsulated-pdf PUBLIC ${ITK_LIBRARIES})
