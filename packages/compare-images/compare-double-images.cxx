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

#include <vector>

#include "itkPipeline.h"
#include "itkInputImage.h"
#include "itkOutputImage.h"
#include "itkOutputTextStream.h"
#include "itkSupportInputImageTypes.h"

#include "itkImage.h"
#include "itkRescaleIntensityImageFilter.h"
#include "itkExtractImageFilter.h"
#include "itkTestingComparisonImageFilter.h"

#include "rapidjson/document.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"

template<typename TImage>
int
CompareImages(itk::wasm::Pipeline & pipeline, const TImage * testImage)
{
  using ImageType = TImage;

  pipeline.get_option("test-image")->required()->type_name("INPUT_IMAGE");

  using InputImageType = itk::wasm::InputImage<ImageType>;
  std::vector<InputImageType> baselineImages;
  pipeline.add_option("-b,--baseline-images", baselineImages, "Baseline images to compare against")->required()->expected(1,-1)->type_name("INPUT_IMAGE");

  itk::wasm::OutputTextStream metrics;
  pipeline.add_option("metrics", metrics, "Metrics for the baseline with the fewest number of pixels outside the tolerances.")->type_name("OUTPUT_JSON");

  using OutputImageType = itk::wasm::OutputImage<ImageType>;
  OutputImageType differenceImage;
  pipeline.add_option("difference-image", differenceImage, "Absolute difference image")->type_name("OUTPUT_IMAGE");

  using Image2DType = itk::Image<double, 2>;
  using Uchar2DImageType = itk::Image<unsigned char, 2>;
  using OutputUchar2DImageType = itk::wasm::OutputImage<Uchar2DImageType>;
  OutputUchar2DImageType differenceUchar2DImage;
  pipeline.add_option("difference-uchar-2d-image", differenceUchar2DImage, "Unsigned char, 2D difference image for rendering")->type_name("OUTPUT_IMAGE");

  double differenceThreshold = 0.0;
  pipeline.add_option("-d,--difference-threshold", differenceThreshold, "Intensity difference for pixels to be considered different.");

  unsigned int radiusTolerance = 0;
  pipeline.add_option("-r,--radius-tolerance", radiusTolerance, "Radius of the neighborhood around a pixel to search for similar intensity values.");

  uint64_t numberOfPixelsTolerance = 0;
  pipeline.add_option("-n,--number-of-pixels-tolerance", numberOfPixelsTolerance, "Number of pixels that can be different before the test fails.");

  bool ignoreBoundaryPixels = false;
  pipeline.add_flag("-i,--ignore-boundary-pixels", ignoreBoundaryPixels, "Ignore boundary pixels. Useful when resampling may have introduced difference pixel values along the image edge.");

  ITK_WASM_PARSE(pipeline);

  using DiffType = itk::Testing::ComparisonImageFilter<ImageType, ImageType>;
  auto diff = DiffType::New();
  diff->SetValidInput(testImage);

  diff->SetDifferenceThreshold(differenceThreshold);
  diff->SetToleranceRadius(radiusTolerance);
  diff->SetIgnoreBoundaryPixels(ignoreBoundaryPixels);

  double minimumDifference = itk::NumericTraits<double>::max();
  double maximumDifference = itk::NumericTraits<double>::NonpositiveMin();
  double totalDifference = 0.0;
  double meanDifference = 0.0;
  uint64_t numberOfPixelsWithDifferences = itk::NumericTraits<uint64_t>::max();

  size_t bestBaselineIndex = 0;
  size_t baselineCount = 0;
  for (auto baselineImage : baselineImages)
  {
    diff->SetTestInput(baselineImage.Get());
    ITK_WASM_CATCH_EXCEPTION(pipeline, diff->UpdateLargestPossibleRegion());

    if (diff->GetNumberOfPixelsWithDifferences() <= numberOfPixelsWithDifferences)
    {
      minimumDifference = diff->GetMinimumDifference();
      maximumDifference = diff->GetMaximumDifference();
      totalDifference = diff->GetTotalDifference();
      meanDifference = diff->GetMeanDifference();
      numberOfPixelsWithDifferences = diff->GetNumberOfPixelsWithDifferences();
      bestBaselineIndex = baselineCount;
    }
    ++baselineCount;
  }

  if (bestBaselineIndex != baselineCount)
  {
    diff->SetTestInput(baselineImages[bestBaselineIndex].Get());
    ITK_WASM_CATCH_EXCEPTION(pipeline, diff->UpdateLargestPossibleRegion());

    minimumDifference = diff->GetMinimumDifference();
    maximumDifference = diff->GetMaximumDifference();
    totalDifference = diff->GetTotalDifference();
    meanDifference = diff->GetMeanDifference();
  }

  const bool almostEqual = (numberOfPixelsWithDifferences <= numberOfPixelsTolerance);

  rapidjson::Document metricsJson;
  metricsJson.SetObject();
  rapidjson::Document::AllocatorType& allocator = metricsJson.GetAllocator();

  rapidjson::Value almostEqualValue;
  almostEqualValue.SetBool(almostEqual);
  metricsJson.AddMember("almostEqual", almostEqualValue, allocator);

  rapidjson::Value numberOfPixelsWithDifferencesValue;
  numberOfPixelsWithDifferencesValue.SetUint64(numberOfPixelsWithDifferences);
  metricsJson.AddMember("numberOfPixelsWithDifferences", numberOfPixelsWithDifferencesValue, allocator);

  rapidjson::Value minimumDifferenceValue;
  minimumDifferenceValue.SetDouble(minimumDifference);
  metricsJson.AddMember("minimumDifference", minimumDifferenceValue, allocator);

  rapidjson::Value maximumDifferenceValue;
  maximumDifferenceValue.SetDouble(maximumDifference);
  metricsJson.AddMember("maximumDifference", maximumDifferenceValue, allocator);

  rapidjson::Value totalDifferenceValue;
  totalDifferenceValue.SetDouble(totalDifference);
  metricsJson.AddMember("totalDifference", totalDifferenceValue, allocator);

  rapidjson::Value meanDifferenceValue;
  meanDifferenceValue.SetDouble(meanDifference);
  metricsJson.AddMember("meanDifference", meanDifferenceValue, allocator);

  rapidjson::StringBuffer stringBuffer;
  rapidjson::Writer<rapidjson::StringBuffer> writer(stringBuffer);
  metricsJson.Accept(writer);

  metrics.Get() << stringBuffer.GetString();

  typename ImageType::ConstPointer difference = diff->GetOutput();
  differenceImage.Set(difference);

  using ExtractType = itk::ExtractImageFilter<ImageType, Image2DType>;
  using RescaleType = itk::RescaleIntensityImageFilter<Image2DType, Uchar2DImageType>;

  using RegionType = typename ImageType::RegionType;
  RegionType region;
  typename ImageType::IndexType index;
  index.Fill(0);
  typename ImageType::SizeType size;
  size.Fill(0);

  size = diff->GetOutput()->GetLargestPossibleRegion().GetSize();
  for (unsigned int i = 2; i < ImageType::ImageDimension; ++i)
  {
    index[i] = size[i] / 2;
    size[i] = 0;
  }
  region.SetIndex(index);
  region.SetSize(size);

  auto extract = ExtractType::New();
  extract->SetDirectionCollapseToSubmatrix();

  extract->SetInput(diff->GetOutput());
  extract->SetExtractionRegion(region);

  auto rescale = RescaleType::New();

  const unsigned char nonPositiveMin = itk::NumericTraits<unsigned char>::NonpositiveMin();
  rescale->SetOutputMinimum(nonPositiveMin);
  const unsigned char unsignedCharMax = itk::NumericTraits<unsigned char>::max();
  rescale->SetOutputMaximum(unsignedCharMax);
  rescale->SetInput(extract->GetOutput());
  ITK_WASM_CATCH_EXCEPTION(pipeline, rescale->UpdateLargestPossibleRegion());

  typename Uchar2DImageType::ConstPointer rescaled = rescale->GetOutput();
  differenceUchar2DImage.Set(rescaled);

  return EXIT_SUCCESS;
}

template<typename TImage>
class PipelineFunctor
{
public:
  int operator()(itk::wasm::Pipeline & pipeline)
  {
    using ImageType = TImage;

    using InputImageType = itk::wasm::InputImage<ImageType>;
    InputImageType testImage;
    pipeline.add_option("test-image", testImage, "The input test image");

    ITK_WASM_PRE_PARSE(pipeline);

    typename ImageType::ConstPointer image = testImage.Get();
    return CompareImages<ImageType>(pipeline, image);
  }
};

int main(int argc, char * argv[])
{
  itk::wasm::Pipeline pipeline("compare-double-images", "Compare double pixel type images with a tolerance for regression testing.", argc, argv);

  return itk::wasm::SupportInputImageTypes<PipelineFunctor,

   double>
  ::Dimensions<2U,3U,4U,5U,6U>("test-image", pipeline);
}