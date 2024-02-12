ARG BASE_IMAGE=docker.io/dockcross/web-wasm
FROM $BASE_IMAGE:20240418-88c04a4
ARG BASE_IMAGE

LABEL maintainer="Matt McCormick <matt.mccormick@kitware.com>"
LABEL org.opencontainers.image.source="https://github.com/InsightSoftwareConsortium/ITK-Wasm"

WORKDIR /

# Note: on entry, emsdk will prepend to the path with its own node, so add to an earlier path
ENV NODE_TAG v20.12.2
RUN curl -LO https://nodejs.org/dist/${NODE_TAG}/node-${NODE_TAG}-linux-x64.tar.xz && \
  tar xvJf node-${NODE_TAG}-linux-x64.tar.xz && \
  rm node-${NODE_TAG}-linux-x64.tar.xz && \
  mkdir -p /emsdk/upstream/emscripten/ && \
  ln -s /node-${NODE_TAG}-linux-x64/bin/node /emsdk/upstream/emscripten && \
  ln -s /node-${NODE_TAG}-linux-x64/bin/npm /emsdk/upstream/emscripten && \
  ln -s /node-${NODE_TAG}-linux-x64/bin/npx /emsdk/upstream/emscripten
ENV PATH /emsdk/upstream/emscripten:${PATH}

ENV zstd_GIT_TAG v1.5.5
RUN curl -L https://api.github.com/repos/facebook/zstd/tarball/${zstd_GIT_TAG} | tar xz --strip=1 --one-top-level=zstd && \
  mkdir zstd-build && \
  cd zstd-build && \
  CC=cc CXX=c++ /usr/bin/cmake \
    -G Ninja \
    -DCMAKE_INSTALL_PREFIX:PATH=/usr \
    -DZSTD_BUILD_SHARED:BOOL=OFF \
    -DCMAKE_TOOLCHAIN_FILE="" \
    ../zstd/build/cmake/ && \
  ninja && \
  ninja install && \
  cd .. && \
  rm -rf zstd-build zstd

# tag commit date: 2024-05-21
ENV ITK_GIT_TAG d03c2616856b28f708002cd1eff9b79660c7c9b0
ENV ITK_GIT_BRANCH itkwasm-2024-06-06
RUN git clone --branch $ITK_GIT_BRANCH --single-branch --depth 1 https://github.com/jadh4v/ITK.git && \
  sed -i -e '/^option(OPJ_USE_THREAD/c\option(OPJ_USE_THREAD "use threads" OFF)' \
    /ITK/Modules/ThirdParty/GDCM/src/gdcm/Utilities/gdcmopenjpeg/src/lib/openjp2/CMakeLists.txt

# Modify CMake variable to use patched DCMTK library
# GIT_TAG refers to DCMTK branch: 20240311_DCMTK_PATCHES_FOR_ITK-wasm
RUN sed -i -e '/^set(DCMTK_GIT_REPOSITORY/c\set(DCMTK_GIT_REPOSITORY "https://github.com/jadh4v/DCMTK.git")' \
    /ITK/Modules/ThirdParty/DCMTK/DCMTKGitTag.cmake

RUN sed -i -e '/^set(DCMTK_GIT_TAG/c\set(DCMTK_GIT_TAG "e356f2929f84567603e39a3191d2ad5159adb703")' \
    /ITK/Modules/ThirdParty/DCMTK/DCMTKGitTag.cmake

RUN if test -e $WASI_SDK_PATH/share/cmake/wasi-sdk.cmake; then sed -i '/cmake_minimum_required/d' $WASI_SDK_PATH/share/cmake/wasi-sdk.cmake; fi
RUN if test -e $WASI_SDK_PATH/share/cmake/wasi-sdk-threads.cmake; then sed -i '/cmake_minimum_required/d' $WASI_SDK_PATH/share/cmake/wasi-sdk-threads.cmake; fi

ARG CMAKE_BUILD_TYPE=Release

ARG LDFLAGS
ARG CFLAGS
ARG CXXFLAGS
ENV LDFLAGS=${LDFLAGS:-"-flto -s ALLOW_MEMORY_GROWTH=1 -s MAXIMUM_MEMORY=4GB"}
ENV CFLAGS=${CFLAGS:-"-msimd128 -flto -Wno-warn-absolute-paths -DITK_WASM_NO_FILESYSTEM_IO"}
ENV CXXFLAGS=${CXXFLAGS:-"${CFLAGS}"}

RUN mkdir ITK-build && \
  cd ITK-build && \
  cmake \
    -G Ninja \
    -DCMAKE_TOOLCHAIN_FILE=${CMAKE_TOOLCHAIN_FILE} \
    -DCMAKE_CXX_STANDARD:STRING=20 \
    -DCMAKE_INSTALL_PREFIX:PATH=/usr \
    -DCMAKE_BUILD_TYPE:STRING=$CMAKE_BUILD_TYPE \
    -DBUILD_EXAMPLES:BOOL=OFF \
    -DBUILD_TESTING:BOOL=OFF \
    -DITK_LEGACY_REMOVE:BOOL=ON \
    -DITK_BUILD_DEFAULT_MODULES:BOOL=ON \
    -DITKGroup_IO:BOOL=ON \
    -DH5_HAVE_GETPWUID:BOOL=OFF \
    -DModule_ITKIOMINC:BOOL=ON \
    -DModule_MGHIO:BOOL=ON \
    -DModule_IOMeshSWC:BOOL=ON \
    -DModule_IOScanco:BOOL=ON \
    -DModule_IOFDF:BOOL=ON \
    -DModule_ITKDCMTK:BOOL=ON \
    -DModule_ITKImageFunction:BOOL=ON \
    -DModule_MinimalPathExtraction:BOOL=ON \
    -DModule_MorphologicalContourInterpolation:BOOL=ON \
    -DModule_SmoothingRecursiveYvvGaussianFilter:BOOL=ON \
    -DModule_Cuberille:BOOL=ON \
    -DModule_TotalVariation:BOOL=ON \
    -DModule_IOMeshSTL:BOOL=ON \
    -DModule_GenericLabelInterpolator:BOOL=ON \
    -DDO_NOT_BUILD_ITK_TEST_DRIVER:BOOL=ON \
    -DOPJ_USE_THREAD:BOOL=OFF \
    -DDCMTK_WITH_THREADS:BOOL=OFF \
    -DDCMTK_BUILD_APPS:BOOL=OFF \
    -DNO_FLOAT_EXCEPTIONS:BOOL=ON \
    ../ITK && \
  ninja && \
  find . -name '*.o' -delete && \
  cd .. && chmod -R 777 ITK-build

ENV ITKMeshToPolyData_GIT_TAG 1e594b7437a43be348b0ccea827c66fb5aa13e1f
RUN git clone https://github.com/InsightSoftwareConsortium/ITKMeshToPolyData.git && \
  cd ITKMeshToPolyData && \
  git checkout ${ITKMeshToPolyData_GIT_TAG} && \
  cd / && \
  mkdir ITKMeshToPolyData-build && \
  cd ITKMeshToPolyData-build && \
  cmake \
    -G Ninja \
    -DCMAKE_TOOLCHAIN_FILE=${CMAKE_TOOLCHAIN_FILE} \
    -DCMAKE_CXX_STANDARD:STRING=20 \
    -DCMAKE_INSTALL_PREFIX:PATH=/usr \
    -DCMAKE_BUILD_TYPE:STRING=$CMAKE_BUILD_TYPE \
    -DBUILD_TESTING:BOOL=OFF \
    -DITK_DIR:PATH=/ITK-build \
    ../ITKMeshToPolyData && \
  ninja && \
  find . -name '*.o' -delete && \
  cd .. && chmod -R 777 ITK-build

# Build-time metadata as defined at http://label-schema.org
ARG BUILD_DATE
ARG IMAGE=itkwasm/base
ARG VERSION=latest
ARG VCS_REF
ARG VCS_URL
LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.name=$IMAGE \
      org.label-schema.version=$VERSION \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.vcs-url=$VCS_URL \
      org.label-schema.schema-version="1.0"
ENV DEFAULT_DOCKCROSS_IMAGE ${IMAGE}:${VERSION}
WORKDIR /work
