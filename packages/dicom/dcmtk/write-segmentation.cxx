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
// CLP includes
// #include "dcmqi/segimage2itkimageCLP.h"
// #include "itkSmartPointer.h"

// DCMQI includes
#include "dcmqi/Itk2DicomConverter.h"
// DCMQI includes
#undef HAVE_SSTREAM // Avoid redefinition warning
#include "dcmqi/internal/VersionConfigure.h"

// DCMTK includes
#include "dcmtk/oflog/configrt.h"

#include "itkPipeline.h"
#include "itkOutputImage.h"
#include "itkVectorImage.h"

typedef dcmqi::Helper helper;
constexpr unsigned int Dimension = 3;
using PixelType = short;
using ScalarImageType = itk::Image<PixelType, Dimension>;
using VectorImageType = itk::VectorImage<PixelType, Dimension>;
int runPipeline(itk::wasm::Pipeline & pipeline, itk::wasm::InputImage<ImageType> inputImage, const std::string & outputDICOMFilename)
{
  return EXIT_FAILURE;
}

int main(int argc, char * argv[])
{
  itk::wasm::Pipeline pipeline("write-segmentation", "Write segmentation image as DICOM object", argc, argv);

  std::string dicomFileName;
  pipeline.add_option("dicom-file", dicomFileName, "Input DICOM file")->required()->check(CLI::ExistingFile)->type_name("INPUT_BINARY_FILE");

  itk::wasm::OutputImage<ImageType> outputImage;
  pipeline.add_option("outputImage", outputImage, "dicom segmentation object as an image")->required()->type_name("OUTPUT_IMAGE");

  ITK_WASM_PARSE(pipeline);

  // Pipeline code goes here
  runPipeline(pipeline, dicomFileName, outputImage);

  return EXIT_SUCCESS;
}
  
