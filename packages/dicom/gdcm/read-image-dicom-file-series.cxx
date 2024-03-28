/*=========================================================================
 *
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
#include <string>
#include <vector>
#include <fstream>
#include <memory>

#include "rapidjson/document.h"
#include "rapidjson/prettywriter.h"
#include "rapidjson/ostreamwrapper.h"

#include "itkCommonEnums.h"
#include "gdcmSerieHelper.h"
#include "itkImageIOBase.h"
#include "itkImageSeriesReader.h"
#include "itkGDCMImageIO.h"
#include "itkImage.h"
#include "itksys/SystemTools.hxx"

#include "itkPipeline.h"
#include "itkOutputImage.h"
#include "itkOutputTextStream.h"

#include "SortSpatially.h"

namespace itk
{

template <typename TOutputImage>
class ITK_TEMPLATE_EXPORT QuickDICOMImageSeriesReader : public ImageSeriesReader<TOutputImage>
{
public:
  ITK_DISALLOW_COPY_AND_ASSIGN(QuickDICOMImageSeriesReader);

  /** Standard class type aliases. */
  using Self = QuickDICOMImageSeriesReader;
  using Superclass = ImageSeriesReader<TOutputImage>;
  using Pointer = SmartPointer<Self>;

  /** Method for creation through the object factory. */
  itkNewMacro(Self);

  /** Run-time type information (and related methods). */
  itkTypeMacro(QuickDICOMImageSeriesReader, ImageSeriesReader);

  /** The size of the output image. */
  using SizeType = typename TOutputImage::SizeType;

  /** The index of the output image. */
  using IndexType = typename TOutputImage::IndexType;

  /** The region of the output image. */
  using ImageRegionType = typename TOutputImage::RegionType;

  /** The pixel type of the output image. */
  using OutputImagePixelType = typename TOutputImage::PixelType;

protected:
  QuickDICOMImageSeriesReader()
    {
    }

  ~QuickDICOMImageSeriesReader() override
    {
    }

  /** Does the real work. */
  void
  GenerateData() override
    {
      TOutputImage * output = this->GetOutput();

      ImageRegionType requestedRegion = output->GetRequestedRegion();
      ImageRegionType largestRegion = output->GetLargestPossibleRegion();
      ImageRegionType sliceRegionToRequest = output->GetRequestedRegion();

      // Each file must have the same size.
      SizeType validSize = largestRegion.GetSize();

      // If more than one file is being read, then the input dimension
      // will be less than the output dimension.  In this case, set
      // the last dimension that is other than 1 of validSize to 1.  However, if the
      // input and output have the same number of dimensions, this should
      // not be done because it will lower the dimension of the output image.
      if (TOutputImage::ImageDimension != this->m_NumberOfDimensionsInImage)
      {
        validSize[this->m_NumberOfDimensionsInImage] = 1;
        sliceRegionToRequest.SetSize(this->m_NumberOfDimensionsInImage, 1);
        sliceRegionToRequest.SetIndex(this->m_NumberOfDimensionsInImage, 0);
      }

      ImageIORegion imageIORegion(this->m_NumberOfDimensionsInImage);
      for (unsigned int dim = 0; dim < this->m_NumberOfDimensionsInImage; ++dim) {
        imageIORegion.SetSize(dim, sliceRegionToRequest.GetSize(dim));
        imageIORegion.SetIndex(dim, sliceRegionToRequest.GetIndex(dim));
      }
      // the size of the buffer is computed based on the actual number of
      // pixels to be read and the actual size of the pixels to be read
      // (as opposed to the sizes of the output)
      const size_t sizeOfActualIORegion =
        imageIORegion.GetNumberOfPixels() * (this->m_ImageIO->GetComponentSize() * this->m_ImageIO->GetNumberOfComponents());


      // Allocate the output buffer
      output->SetBufferedRegion(requestedRegion);
      output->Allocate();

      // progress reported on a per slice basis
      ProgressReporter progress(this, 0, requestedRegion.GetSize(TOutputImage::ImageDimension - 1), 100);

      const bool needToUpdateMetaDataDictionaryArray = false;

      typename TOutputImage::InternalPixelType * outputBuffer = output->GetBufferPointer();
      IndexType                                  sliceStartIndex = requestedRegion.GetIndex();
      const auto                                 numberOfFiles = static_cast<int>(this->m_FileNames.size());

      typename TOutputImage::PointType   prevSliceOrigin = output->GetOrigin();
      typename TOutputImage::SpacingType outputSpacing = output->GetSpacing();
      double                             maxSpacingDeviation = 0.0;
      bool                               prevSliceIsValid = false;

      for (int i = 0; i != numberOfFiles; ++i)
      {
        if (TOutputImage::ImageDimension != this->m_NumberOfDimensionsInImage)
        {
          sliceStartIndex[this->m_NumberOfDimensionsInImage] = i;
        }

        const bool insideRequestedRegion = requestedRegion.IsInside(sliceStartIndex);
        const int  iFileName = i;
        bool       nonUniformSampling = false;
        double     spacingDeviation = 0.0;

        // check if we need this slice
        if (!insideRequestedRegion && !needToUpdateMetaDataDictionaryArray)
        {
          continue;
        }

        this->m_ImageIO->SetFileName(this->m_FileNames[iFileName].c_str());
        this->m_ImageIO->SetIORegion(imageIORegion);

        const size_t numberOfPixelsInSlice = sliceRegionToRequest.GetNumberOfPixels();

        using AccessorFunctorType = typename TOutputImage::AccessorFunctorType;
        const size_t numberOfInternalComponentsPerPixel = AccessorFunctorType::GetVectorLength(output);


        const ptrdiff_t sliceOffset = (TOutputImage::ImageDimension != this->m_NumberOfDimensionsInImage)
                                        ? (i - requestedRegion.GetIndex(this->m_NumberOfDimensionsInImage))
                                        : 0;

        const ptrdiff_t numberOfPixelComponentsUpToSlice =
          numberOfPixelsInSlice * numberOfInternalComponentsPerPixel * sliceOffset;

        typename TOutputImage::InternalPixelType * outputSliceBuffer = outputBuffer + numberOfPixelComponentsUpToSlice;
        this->m_ImageIO->Read(outputSliceBuffer);

        // report progress for read slices
        progress.CompletedPixel();

      } // end per slice loop
    } // end GenerateData
};

} // end namespace itk

template <typename TImage>
int runPipeline(itk::wasm::Pipeline & pipeline, std::vector<std::string> & inputFileNames)
{
  using ImageType = TImage;

  using OutputImageType = itk::wasm::OutputImage<ImageType>;
  OutputImageType outputImage;
  pipeline.add_option("output-image", outputImage, "Output image volume")->required()->type_name("OUTPUT_IMAGE");

  itk::wasm::OutputTextStream sortedFilenames;
  auto sortedFilenamesOption = pipeline.add_option("sorted-filenames", sortedFilenames, "Output sorted filenames.")->required()->type_name("OUTPUT_JSON");

  bool singleSortedSeries = false;
  pipeline.add_flag("-s,--single-sorted-series", singleSortedSeries, "The input files are a single sorted series");

  ITK_WASM_PARSE(pipeline);

  typedef itk::QuickDICOMImageSeriesReader< ImageType > ReaderType;
  typename ReaderType::Pointer reader = ReaderType::New();
  reader->SetMetaDataDictionaryArrayUpdate(false);

  if (!singleSortedSeries)
  {
    std::vector<std::string> fileNames = sortSpatially(inputFileNames);
    reader->SetFileNames(fileNames);
  }
  else
  {
    reader->SetFileNames(inputFileNames);
  }

  // copy sorted filenames as additional output
  rapidjson::Document document(rapidjson::kArrayType);
  rapidjson::Document::AllocatorType& allocator = document.GetAllocator();
  auto finalFileList = reader->GetFileNames();
  for (auto f = finalFileList.begin(); f != finalFileList.end(); ++f)
  {
    rapidjson::Value value;
    value.SetString((*f).c_str(), allocator);
    document.PushBack(value, allocator);
  }
  rapidjson::OStreamWrapper ostreamWrapper( sortedFilenames.Get() );
  rapidjson::PrettyWriter< rapidjson::OStreamWrapper > writer( ostreamWrapper );
  document.Accept( writer );

  auto gdcmImageIO = itk::GDCMImageIO::New();
  reader->SetImageIO(gdcmImageIO);

  ITK_WASM_CATCH_EXCEPTION(pipeline, reader->Update());
  outputImage.Set(reader->GetOutput());

  return EXIT_SUCCESS;
}

template <typename TComp>
int runPipeline(itk::wasm::Pipeline & pipeline, std::vector<std::string> & inputFileNames, int numberOfComponents)
{
  using ComponentType = TComp;
  static constexpr unsigned int ImageDimension = 3;
  switch (numberOfComponents)
    {
    case 4:
      {
      typedef itk::Vector< ComponentType, 4> PixelType;
      typedef itk::Image<PixelType, ImageDimension> ImageType;
      return runPipeline<ImageType>(pipeline, inputFileNames);
      }
    case 3:
      {
      typedef itk::Vector< ComponentType, 3> PixelType;
      typedef itk::Image<PixelType, ImageDimension> ImageType;
      return runPipeline<ImageType>(pipeline, inputFileNames);
      }
    case 2:
      {
      typedef itk::Vector< ComponentType, 2> PixelType;
      typedef itk::Image<PixelType, ImageDimension> ImageType;
      return runPipeline<ImageType>(pipeline, inputFileNames);
      }
    case 1:
    default:
      {
      typedef itk::Image<TComp, ImageDimension> ImageType;
      return runPipeline<ImageType>(pipeline, inputFileNames);
      }
    }
}

int main (int argc, char * argv[])
{
  itk::wasm::Pipeline pipeline("read-image-dicom-file-series", "Read a DICOM image series and return the associated image volume", argc, argv);
  pipeline.set_version("2.0.0");

  std::vector<std::string> inputFileNames;
  pipeline.add_option("-i,--input-images", inputFileNames, "File names in the series")->required()->check(CLI::ExistingFile)->expected(1,-1)->type_name("INPUT_BINARY_FILE");

  // Type is not important here, its just a dummy placeholder to be added and then removed.
  std::string outputImage;
  auto outputImageOption = pipeline.add_option("output-image", outputImage, "Output image volume")->required()->type_name("OUTPUT_IMAGE");

  // Type is not important here, its just a dummy placeholder to be added and then removed.
  std::string sortedFilenames;
  auto sortedFilenamesOption = pipeline.add_option("sorted-filenames", sortedFilenames, "Output sorted filenames")->required()->type_name("OUTPUT_JSON");

  // We are interested in reading --input-images beforehand.
  // We need to add and then remove other options in order to do ITK_WASM_PARSE twice (once here in main, and then again in runPipeline)
  bool singleSortedSeries = false;
  auto sortedOption = pipeline.add_flag("-s,--single-sorted-series", singleSortedSeries, "The input files are a single sorted series");

  ITK_WASM_PARSE(pipeline);

  // Remove added dummy options. runPipeline will add the real options later.
  pipeline.remove_option(sortedOption);
  pipeline.remove_option(outputImageOption);
  pipeline.remove_option(sortedFilenamesOption);

  auto gdcmImageIO = itk::GDCMImageIO::New();

  gdcmImageIO->SetFileName(inputFileNames[0]);
  gdcmImageIO->ReadImageInformation();
  const auto ioComponentType = gdcmImageIO->GetComponentType();
  // Todo: work with the ioPixelType
  // const auto ioPixelType = gdcmImageIO->GetPixelType();
  const auto numberOfComponents = gdcmImageIO->GetNumberOfComponents();
  static constexpr unsigned int ImageDimension = 3;

  switch(ioComponentType)
    {
    case itk::CommonEnums::IOComponent::UCHAR:
      {
      return runPipeline< unsigned char>(pipeline, inputFileNames, numberOfComponents);
      }
    case itk::CommonEnums::IOComponent::CHAR:
      {
      return runPipeline< char>(pipeline, inputFileNames, numberOfComponents);
      }
    case itk::CommonEnums::IOComponent::USHORT:
      {
      return runPipeline< unsigned short>(pipeline, inputFileNames, numberOfComponents);
      }
    case itk::CommonEnums::IOComponent::SHORT:
      {
      return runPipeline< short>(pipeline, inputFileNames, numberOfComponents);
      }
    case itk::CommonEnums::IOComponent::UINT:
      {
      return runPipeline< unsigned int>(pipeline, inputFileNames, numberOfComponents);
      }
    case itk::CommonEnums::IOComponent::INT:
      {
      return runPipeline< int>(pipeline, inputFileNames, numberOfComponents);
      }
    case itk::CommonEnums::IOComponent::ULONG:
      {
      return runPipeline< unsigned long>(pipeline, inputFileNames, numberOfComponents);
      }
    case itk::CommonEnums::IOComponent::LONG:
      {
      return runPipeline< long>(pipeline, inputFileNames, numberOfComponents);
      }
    case itk::CommonEnums::IOComponent::ULONGLONG:
      {
      return runPipeline< unsigned long long>(pipeline, inputFileNames, numberOfComponents);
      }
    case itk::CommonEnums::IOComponent::LONGLONG:
      {
      return runPipeline< long long>(pipeline, inputFileNames, numberOfComponents);
      }
    case itk::CommonEnums::IOComponent::FLOAT:
      {
      return runPipeline< float>(pipeline, inputFileNames, numberOfComponents);
      }
    case itk::CommonEnums::IOComponent::DOUBLE:
      {
      return runPipeline< double>(pipeline, inputFileNames, numberOfComponents);
      }
    case itk::CommonEnums::IOComponent::UNKNOWNCOMPONENTTYPE:
    default:
      {
      std::cerr << "Unknown image pixel component type." << std::endl;
      return EXIT_FAILURE;
      }
    }
}
