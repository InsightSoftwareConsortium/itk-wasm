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
// #undef HAVE_SSTREAM // Avoid redefinition warning
#include "dcmqi/Dicom2ItkConverter.h"
#include "dcmqi/internal/VersionConfigure.h"

// DCMTK includes
#include "dcmtk/oflog/configrt.h"

// ITK includes
#include "itkComposeImageFilter.h"
#include "itkVectorImage.h"

// ITK-wasm includes
#include "itkPipeline.h"
#include "itkOutputImage.h"

typedef dcmqi::Helper helper;
constexpr unsigned int Dimension = 3;
using PixelType = short;
using ScalarImageType = itk::Image<PixelType, Dimension>;
using VectorImageType = itk::VectorImage<PixelType, Dimension>;

int runPipeline(itk::wasm::Pipeline & pipeline, const std::string & inputSEGFileName, itk::wasm::OutputImage<VectorImageType> outputImage, const bool mergeSegments)
{
#if !defined(NDEBUG) || defined(_DEBUG)
  // Display DCMTK debug, warning, and error logs in the console
  dcmtk::log4cplus::BasicConfigurator::doConfigure();
#endif

  if(helper::isUndefinedOrPathDoesNotExist(inputSEGFileName, "Input DICOM file"))
  {
    return EXIT_FAILURE;
  }

  DcmRLEDecoderRegistration::registerCodecs();

  DcmFileFormat sliceFF;
  std::cout << "Loading DICOM SEG file " << inputSEGFileName << std::endl;
  CHECK_COND(sliceFF.loadFile(inputSEGFileName.c_str()));
  DcmDataset* dataset = sliceFF.getDataset();

  try
  {
    dcmqi::Dicom2ItkConverter converter;
    std::string metaInfo;
    OFCondition result = converter.dcmSegmentation2itkimage(dataset, metaInfo, mergeSegments);
    if (result.bad())
    {
      std::cerr << "ERROR: Failed to convert DICOM SEG to ITK image: " << result.text() << std::endl;
      return EXIT_FAILURE;
    }

/*
  using ImageToVectorImageFilterType = itk::ComposeImageFilter<ScalarImageType>;
  auto imageToVectorImageFilter = ImageToVectorImageFilterType::New();
  imageToVectorImageFilter->SetInput(0, image0);
  imageToVectorImageFilter->SetInput(1, image1);
  imageToVectorImageFilter->SetInput(2, image2);
  imageToVectorImageFilter->Update();

  VectorImageType::Pointer vectorImage = imageToVectorImageFilter->GetOutput();
  */

    itk::SmartPointer<ScalarImageType> itkImage = converter.begin();
    if (itkImage)
    {
      // outputImage.Set(itkImage);
      return EXIT_SUCCESS;
    }
  }
  catch (int e)
  {
    std::cerr << "Fatal error encountered." << std::endl;
    return EXIT_FAILURE;
  }

  return EXIT_FAILURE;
}

int main(int argc, char * argv[])
{
  itk::wasm::Pipeline pipeline("read-segmentation", "Read DICOM segmentation objects", argc, argv);

  std::string dicomFileName;
  pipeline.add_option("dicom-file", dicomFileName, "Input DICOM file")->required()->check(CLI::ExistingFile)->type_name("INPUT_BINARY_FILE");

  itk::wasm::OutputImage<VectorImageType> outputImage;
  pipeline.add_option("outputImage", outputImage, "dicom segmentation object as an image")->required()->type_name("OUTPUT_IMAGE");

  bool mergeSegments{false};
  pipeline.add_flag("--merge-segments", mergeSegments, "Merge segments into a single image");

  ITK_WASM_PARSE(pipeline);

  // Pipeline code goes here
  runPipeline(pipeline, dicomFileName, outputImage, mergeSegments);

  return EXIT_SUCCESS;
}
  
