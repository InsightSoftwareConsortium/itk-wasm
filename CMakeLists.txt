cmake_minimum_required(VERSION 3.24.2)
project(WebAssemblyInterface)

set(CMAKE_CXX_STANDARD 20)

if(POLICY CMP0135)
  cmake_policy(SET CMP0135 NEW)
endif()

set(WebAssemblyInterface_LIBRARIES WebAssemblyInterface)

include(FetchContent)
set(_itk_build_testing ${BUILD_TESTING})
set(BUILD_TESTING OFF)
set(_itk_build_shared ${BUILD_SHARED_LIBS})
set(BUILD_SHARED_LIBS OFF)
if(NOT DEFINED CMAKE_POSITION_INDEPENDENT_CODE)
  set(CMAKE_POSITION_INDEPENDENT_CODE ON)
endif()

# Uses newer CMake
set(RapidJSON_GIT_REPOSITORY "https://github.com/thewtex/rapidjson.git")
set(RapidJSON_GIT_TAG        "3c70d501767f5cb37bf0ccaff0f784ddd0961752")
set(RAPIDJSON_BUILD_CXX17 ON)
set(RAPIDJSON_BUILD_DOC OFF)
set(RAPIDJSON_BUILD_EXAMPLES OFF)
set(RAPIDJSON_BUILD_TESTS OFF)
set(RAPIDJSON_ENABLE_INSTRUMENTATION_OPT OFF)
FetchContent_Declare(
  rapidjson_lib
  GIT_REPOSITORY ${RapidJSON_GIT_REPOSITORY}
  GIT_TAG ${RapidJSON_GIT_TAG}
  GIT_SHALLOW TRUE
  )

set(CLI11_GIT_REPOSITORY "https://github.com/CLIUtils/CLI11")
# v2.4.2
set(CLI11_GIT_TAG "6c7b07a878ad834957b98d0f9ce1dbe0cb204fc9")
FetchContent_Declare(
  cli11
  GIT_REPOSITORY ${CLI11_GIT_REPOSITORY}
  GIT_TAG        ${CLI11_GIT_TAG}
  GIT_SHALLOW TRUE
)

set(rang_GIT_REPOSITORY "https://github.com/agauniyal/rang.git")
set(rang_GIT_REPOSITORY "https://github.com/thewtex/rang.git")
# v3.2 + WASI + cmake_minimum_required
set(rang_GIT_TAG "e50d8673fdc1d053b1502752d937c4e76510958c")
FetchContent_Declare(
  rang
  GIT_REPOSITORY ${rang_GIT_REPOSITORY}
  GIT_TAG        ${rang_GIT_TAG}
  GIT_SHALLOW TRUE
)

set(libcbor_GIT_REPOSITORY "https://github.com/PJK/libcbor")
set(libcbor_GIT_REPOSITORY "https://github.com/thewtex/libcbor")
# 2024-04-12 master + CMake + WASI + target_include_directory + GCC | operator
# warning + GCC|Clang|MSVC Return type warning
set(libcbor_GIT_TAG "00003e202293544d00e2b2484b781cb974898d8b")
FetchContent_Declare(
  libcbor
  GIT_REPOSITORY ${libcbor_GIT_REPOSITORY}
  GIT_TAG        ${libcbor_GIT_TAG}
  GIT_SHALLOW TRUE
)
set(WITH_TESTS OFF CACHE BOOL "Build libcbor tests")
set(WITH_EXAMPLES OFF CACHE BOOL "Build libcbor examples")
set(SANITIZE OFF CACHE BOOL "Enable sanitizers in Debug mode in libcbor")

set(cpp_base64_GIT_REPOSITORY "https://github.com/thewtex/cpp-base64.git")
set(cpp_base64_GIT_TAG 9144cd53be930b37235ae552a92b5d2aa51e9325)
FetchContent_Declare(
  cpp_base64
  GIT_REPOSITORY ${cpp_base64_GIT_REPOSITORY}
  GIT_TAG        ${cpp_base64_GIT_TAG}
  GIT_SHALLOW TRUE
)

set(glaze_GIT_REPOSITORY "https://github.com/stephenberry/glaze")
# glaze v2.9.3
set(glaze_GIT_TAG fe49c8e1a057d11484e0bd88ffcbe60277e356fd)
FetchContent_Declare(
  glaze
  GIT_REPOSITORY ${glaze_GIT_REPOSITORY}
  GIT_TAG        ${glaze_GIT_TAG}
  GIT_SHALLOW TRUE
)
if (MSVC)
  string(REGEX MATCH "\/cl(.exe)?$" matched_cl ${CMAKE_CXX_COMPILER})
  if (matched_cl)
    # for a C++ standards compliant preprocessor, not needed for clang-cl
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /Zc:preprocessor /permissive- /Zc:lambda")
  endif()
  # avoid warnings
  set(CMAKE_CXX_STANDARD 23)
endif()

list(APPEND CMAKE_MODULE_PATH ${libcbor_SOURCE_DIR}/CMakeModules)
FetchContent_MakeAvailable(rapidjson_lib cli11 rang libcbor cpp_base64 glaze)
set(RapidJSON_INCLUDE_DIR "${rapidjson_lib_SOURCE_DIR}/include")
set(cli11_INCLUDE_DIR "${cli11_SOURCE_DIR}/include")
set(rang_INCLUDE_DIR "${rang_SOURCE_DIR}/include")
set(libcbor_INCLUDE_DIR "${libcbor_SOURCE_DIR}/src")
set(libcbor_EXPORT_DIR "${libcbor_BINARY_DIR}/src")
set(libcbor_CONFIGURATION_DIR "${libcbor_BINARY_DIR}/")
set(cpp_base64_INCLUDE_DIR "${cpp_base64_SOURCE_DIR}/include")
set(glaze_INCLUDE_DIR "${glaze_SOURCE_DIR}/include")

set(BUILD_TESTING ${_itk_build_testing})
set(BUILD_SHARED_LIBS ${_itk_build_shared})

find_path(RapidJSON_INCLUDE_DIR
 NAMES rapidjson/document.h
 )
set(WebAssemblyInterface_INCLUDE_DIRS
  ${RapidJSON_INCLUDE_DIR}
  ${cli11_INCLUDE_DIR}
  ${rang_INCLUDE_DIR}
  ${libcbor_INCLUDE_DIR}
  ${libcbor_EXPORT_DIR}
  ${libcbor_CONFIGURATION_DIR}
  ${cpp_base64_INCLUDE_DIR}
  ${glaze_INCLUDE_DIR}
  )
list(APPEND WebAssemblyInterface_LIBRARIES cbor cpp-base64)

get_filename_component(_module_dir "${CMAKE_CURRENT_LIST_FILE}" PATH)
set(CMAKE_MODULE_PATH "${_module_dir}/CMake/" ${CMAKE_MODULE_PATH})

if(NOT ITK_SOURCE_DIR)
  find_package(ITK 5.0 REQUIRED)
  list(APPEND CMAKE_MODULE_PATH ${ITK_CMAKE_DIR})
  set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
  include(ITKModuleExternal)
else()
  itk_module_impl()
endif()
itk_module_target_label(cbor)
itk_module_target_export(cbor)
itk_module_target_install(cbor)
itk_module_target_label(cpp-base64)
itk_module_target_export(cpp-base64)
itk_module_target_install(cpp-base64)
