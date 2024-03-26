ARG BASE_IMAGE=dockcross/web-wasm
FROM $BASE_IMAGE:20240326-00e7558
ARG BASE_IMAGE

LABEL maintainer="Matt McCormick <matt.mccormick@kitware.com>"
LABEL org.opencontainers.image.source="https://github.com/InsightSoftwareConsortium/itk-wasm"

WORKDIR /

# Note: on entry, emsdk will prepend to the path with its own node, so add to an earlier path
ENV NODE_TAG v18.17.1
RUN curl -LO https://nodejs.org/dist/${NODE_TAG}/node-${NODE_TAG}-linux-x64.tar.xz && \
  tar xvJf node-${NODE_TAG}-linux-x64.tar.xz && \
  rm node-${NODE_TAG}-linux-x64.tar.xz && \
  mkdir -p /emsdk/upstream/emscripten/ && \
  ln -s /node-${NODE_TAG}-linux-x64/bin/node /emsdk/upstream/emscripten && \
  ln -s /node-${NODE_TAG}-linux-x64/bin/npm /emsdk/upstream/emscripten && \
  ln -s /node-${NODE_TAG}-linux-x64/bin/npx /emsdk/upstream/emscripten
ENV PATH /emsdk/upstream/emscripten:${PATH}

ENV zstd_GIT_TAG v1.5.5
RUN git clone https://github.com/facebook/zstd.git && \
  cd zstd && \
  git checkout ${zstd_GIT_TAG} && \
  cd / && \
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

# tag commit date: 2023-09-17 branch: itkwasm-2023-01-15-f42c10a20f-5
ENV ITK_GIT_TAG fb5b2f0a691dbe107f44ea332a6113aab8810900
RUN git clone https://github.com/KitwareMedical/ITK.git && \
  cd ITK && \
  git checkout ${ITK_GIT_TAG} && \
  cd ../ && \
  sed -i -e '/^option(OPJ_USE_THREAD/c\option(OPJ_USE_THREAD "use threads" OFF)' \
    /ITK/Modules/ThirdParty/GDCM/src/gdcm/Utilities/gdcmopenjpeg/src/lib/openjp2/CMakeLists.txt

# Modify CMake variable to use patched DCMTK library
# GIT_TAG refers to DCMTK branch: 20230115_DCMTK_PATCHES_FOR_ITK-wasm
RUN sed -i -e '/^set(DCMTK_GIT_REPOSITORY/c\set(DCMTK_GIT_REPOSITORY "https://github.com/InsightSoftwareConsortium/DCMTK.git")' \
    /ITK/Modules/ThirdParty/DCMTK/DCMTKGitTag.cmake

RUN sed -i -e '/^set(DCMTK_GIT_TAG/c\set(DCMTK_GIT_TAG "d2c5251de48862ba37c4858266dbe47bda566f4e")' \
    /ITK/Modules/ThirdParty/DCMTK/DCMTKGitTag.cmake

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
    -DCMAKE_CXX_STANDARD:STRING=17 \
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
    -DDCMTK_BUILD_APPS:BOOL=ON \
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
    -DCMAKE_CXX_STANDARD:STRING=17 \
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
