/*=========================================================================

 *  Copyright NumFOCUS
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         https://www.apache.org/licenses/LICENSE-2.0.txt
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 *=========================================================================*/

// DCMQI includes
#include "dcmqi/Itk2DicomConverter.h"
// DCMQI includes
#undef HAVE_SSTREAM // Avoid redefinition warning
#include "dcmqi/internal/VersionConfigure.h"

// DCMTK includes
#include "dcmtk/oflog/configrt.h"

#include "itkPipeline.h"
#include "itkInputImage.h"
#include "itkOutputBinaryStream.h"
#include "itkSupportInputImageTypes.h"

template <typename TImage>
int writeSegmentation(itk::wasm::Pipeline &pipeline, const TImage * inputImage)
{
  using ImageType = TImage;
  constexpr unsigned int Dimension = ImageType::ImageDimension;
  using PixelType = typename ImageType::PixelType;

  pipeline.get_option("input-image")->required()->type_name("INPUT_IMAGE");

  std::string inputRefDicomSeries = 0;
  pipeline.add_option("input-ref-dicom-series", inputRefDicomSeries, "input reference dicom series over which the segmentation was created")->required();

  // itk::wasm::OutputBinaryStream outputDicomFile;
  // pipeline.add_option("output-dicom-file", outputDicomFile, "written dicom segfile")->required()->type_name("OUTPUT_BINARY_STREAM");
  std::string outputDicomFile;
  pipeline.add_option("output-dicom-file", outputDicomFile, "written dicom segfile")->required()->type_name("OUTPUT_BINARY_FILE");

  ITK_WASM_PARSE(pipeline);

  // Pipeline code goes here

  return EXIT_SUCCESS;
}

template <typename TImage>
class PipelineFunctor
{
public:
  int operator()(itk::wasm::Pipeline &pipeline)
  {
    using ImageType = TImage;

    itk::wasm::InputImage<ImageType> inputImage;
    pipeline.add_option("input-image", inputImage, "input segmentation image to write")->type_name("INPUT_IMAGE");

    ITK_WASM_PRE_PARSE(pipeline);

    typename ImageType::ConstPointer inputImageRef = inputImage.Get();
    return writeSegmentation<ImageType>(pipeline, inputImageRef);
  }
};

int main(int argc, char * argv[])
{
  itk::wasm::Pipeline pipeline("write-segmentation", "Write DICOM segmentation object", argc, argv);

  return itk::wasm::SupportInputImageTypes<PipelineFunctor,
    int16_t>
    ::Dimensions<2U, 3U>("input-image", pipeline);
}
