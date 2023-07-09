ARG BASE_IMAGE=dockcross/web-wasm
FROM $BASE_IMAGE:20230622-7312d8f
ARG BASE_IMAGE

LABEL maintainer="Matt McCormick <matt.mccormick@kitware.com>"
LABEL org.opencontainers.image.source="https://github.com/InsightSoftwareConsortium/itk-wasm"

WORKDIR /

# tag commit date: 2023-06-23 branch: itkwasm-2023-01-15-f42c10a20f-3
ENV ITK_GIT_TAG 8aace5fd2b7d6032a5ecf51d1fd37a0a9abe0a44
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
ARG CROSS_TRIPLE
ENV LDFLAGS=${LDFLAGS:-"-flto -s ALLOW_MEMORY_GROWTH=1"}
ENV CFLAGS=${CFLAGS:-"-flto -Wno-warn-absolute-paths -DITK_WASM_NO_FILESYSTEM_IO"}
ENV CXXFLAGS=${CXXFLAGS:-"${CFLAGS}"}
ENV CROSS_TRIPLE=${CROSS_TRIPLE}

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

ENV IPFS_TAG v0.10.0
RUN curl -LO https://github.com/ipfs/go-ipfs/releases/download/${IPFS_TAG}/go-ipfs_${IPFS_TAG}_linux-amd64.tar.gz && \
  tar xvzf go-ipfs_${IPFS_TAG}_linux-amd64.tar.gz && \
  cp go-ipfs/ipfs /usr/local/bin/ && \
  rm -rf go-ipfs
ENV IPFS_PATH /home/ipfs/.ipfs
RUN mkdir -p $IPFS_PATH && \
 ipfs init && \
 chmod -R 777 $IPFS_PATH

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
