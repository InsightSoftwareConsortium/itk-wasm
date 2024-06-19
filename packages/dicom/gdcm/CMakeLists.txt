find_package(ITK REQUIRED
  COMPONENTS ITKCommon
    ITKGDCM
    ITKIOGDCM
    ITKIOImageBase
    WebAssemblyInterface
  )
include(${ITK_USE_FILE})

add_executable(read-image-dicom-file-series read-image-dicom-file-series.cxx)
target_link_libraries(read-image-dicom-file-series PUBLIC ${ITK_LIBRARIES})

if (WASI)
  return()
endif()

# include iconv for reading dicom tags
include(ExternalProject)
set(Iconv iconv)
set(Iconv_LIBRARY libiconv)
set(Iconv_DIR ${CMAKE_BINARY_DIR}/libiconv)
set(Iconv_INCLUDE_DIRS ${Iconv_DIR}/include)
file(MAKE_DIRECTORY ${Iconv_DIR} ${Iconv_INCLUDE_DIRS})

# DICOM tag reading needs Iconv, and the docker image (currently)
# used for building does not have iconv installed
if (EMSCRIPTEN)
  set(Iconv_CONFIGURE_COMMAND
    emconfigure
    ${Iconv_DIR}/src/libiconv/configure
    --srcdir=${Iconv_DIR}/src/libiconv
    --prefix=${Iconv_DIR}
    --host=wasm32
    --enable-static)
  set(Iconv_BUILD_COMMAND emmake make)
else()
  set(Iconv_CONFIGURE_COMMAND
    ${Iconv_DIR}/src/libiconv/configure
    --srcdir=${Iconv_DIR}/src/libiconv
    --prefix=${Iconv_DIR}
    --host=wasm32
    --enable-static)
  set(Iconv_BUILD_COMMAND make)
endif()

if (CMAKE_VERSION VERSION_GREATER_EQUAL "3.23.0")
	cmake_policy(SET CMP0135 NEW)
endif()
ExternalProject_Add(${Iconv_LIBRARY}
  PREFIX ${Iconv_DIR}
  URL "https://bafybeid2yl6aeunciy5rynjmaoxkhhau3jgjpv7x25pylby7hq6n23c57i.ipfs.dweb.link/libiconv-1.16.tar.gz"
      "https://itk.mypinata.cloud/ipfs/bafybeid2yl6aeunciy5rynjmaoxkhhau3jgjpv7x25pylby7hq6n23c57i/libiconv-1.16.tar.gz"
  URL_HASH SHA256=e6a1b1b589654277ee790cce3734f07876ac4ccfaecbee8afa0b649cf529cc04
  CONFIGURE_COMMAND ${Iconv_CONFIGURE_COMMAND}
  BUILD_COMMAND ${Iconv_BUILD_COMMAND}
  # needed for ninja generator
  BUILD_BYPRODUCTS ${Iconv_DIR}/lib/${CMAKE_STATIC_LIBRARY_PREFIX}iconv${CMAKE_STATIC_LIBRARY_SUFFIX}
)

add_library(${Iconv} STATIC IMPORTED)
set_target_properties(${Iconv} PROPERTIES
  IMPORTED_LOCATION ${Iconv_DIR}/lib/${CMAKE_STATIC_LIBRARY_PREFIX}iconv${CMAKE_STATIC_LIBRARY_SUFFIX}
  INTERFACE_INCLUDE_DIRECTORIES ${Iconv_INCLUDE_DIRS})

add_dependencies(${Iconv} ${Iconv_LIBRARY})
add_executable(read-dicom-tags read-dicom-tags.cxx)
target_link_libraries(read-dicom-tags PUBLIC ${ITK_LIBRARIES} ${Iconv_LIBRARIES} ${Iconv})

if (EMSCRIPTEN)
  foreach(dicom_io_module
      read-image-dicom-file-series
      read-dicom-tags
  )
    set(target_esm "${dicom_io_module}")
    set(dicom_common_link_flags " ${common_link_flags} -s SUPPORT_LONGJMP=1 -s DISABLE_EXCEPTION_CATCHING=0")
      set_property(TARGET ${target} APPEND_STRING
        PROPERTY LINK_FLAGS " ${dicom_common_link_flags}"
        )
  endforeach()
endif()
