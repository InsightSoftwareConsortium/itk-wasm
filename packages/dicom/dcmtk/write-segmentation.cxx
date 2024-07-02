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
#undef HAVE_SSTREAM // Avoid redefinition warning
#include "dcmqi/internal/VersionConfigure.h"

// DCMTK includes
#include "dcmtk/oflog/configrt.h"

#include "itkPipeline.h"
#include "itkInputImage.h"
#include "itkOutputBinaryStream.h"
#include "itkSupportInputImageTypes.h"
#include "itkSmartPointer.h"
#include "itkInputTextStream.h"

typedef dcmqi::Helper helper;
constexpr unsigned int Dimension = 3;
using PixelType = short;
using ScalarImageType = itk::Image<PixelType, Dimension>;

int runPipeline(
  const itk::wasm::InputImage<ScalarImageType>& inputImage,
  itk::wasm::InputTextStream& metaInfoStream,
  const std::vector<std::string> & dicomImageFiles,
  const std::string & outputDicomFile,
  const bool skipEmptySlices,
  const bool useLabelIDAsSegmentNumber)
{
  const std::string metaInfo((std::istreambuf_iterator<char>(metaInfoStream.Get())),
                                      std::istreambuf_iterator<char>());

  // Pipeline code goes here
    if(dicomImageFiles.empty()){
    cerr << "Error: No input DICOM files specified!" << endl;
    return EXIT_FAILURE;
  }

  std::vector<ScalarImageType::Pointer> segmentations;
  itk::SmartPointer<ScalarImageType> img(const_cast<ScalarImageType*>(inputImage.Get()));
  // itk::Indent indent;
  // img->Print(std::cout, indent);
  segmentations.push_back(img);

#if !defined(NDEBUG) || defined(_DEBUG)
    // Display DCMTK debug, warning, and error logs in the console
    // For some reason, this code has no effect if it is called too early (e.g., directly after PARSE_ARGS)
    // therefore we call it here.
    dcmtk::log4cplus::BasicConfigurator::doConfigure();
#endif

  if(!helper::pathsExist(dicomImageFiles))
  {
    return EXIT_FAILURE;
  }

  std::vector<DcmDataset*> dcmDatasets = helper::loadDatasets(dicomImageFiles);

  if(dcmDatasets.empty()){
    cerr << "Error: no DICOM could be loaded from the specified list/directory" << endl;
    return EXIT_FAILURE;
  }

  /*
  ifstream metainfoStream(metaInfoFile.c_str(), ios_base::binary);
  std::string metadata( (std::istreambuf_iterator<char>(metainfoStream) ),
                       (std::istreambuf_iterator<char>()));
  */

  Json::Value metaRoot;
  istringstream metainfoisstream(metaInfo);
  metainfoisstream >> metaRoot;

  /*
  // Can't verify segments like this, we will need an ITK filter to count the number of labels in the input image first.
  if(metaRoot.isMember("segmentAttributes")){
    if(metaRoot["segmentAttributes"].size() != segImageFiles.size()){
      cerr << "Error: number of items in the \"segmentAttributes\" metadata array should match the number of input segmentation files!" << endl;
      cerr << "segmentAttributes has: " << metaRoot["segmentAttributes"].size() << " items, the are " << segImageFiles.size() << " input segmentation files!" << endl;
      return EXIT_FAILURE;
    }
  }
  */

  try {
    DcmDataset* result = dcmqi::Itk2DicomConverter::itkimage2dcmSegmentation(dcmDatasets,
                                                                             segmentations,
                                                                             metaInfo,
                                                                             skipEmptySlices,
                                                                             useLabelIDAsSegmentNumber);

    if (result == NULL){
      std::cerr << "ERROR: Conversion failed." << std::endl;
      return EXIT_FAILURE;
    } else {
      DcmFileFormat segdocFF(result);
      bool compress = false;
      if(compress){
        CHECK_COND(segdocFF.saveFile(outputDicomFile.c_str(), EXS_DeflatedLittleEndianExplicit));
      } else {
        CHECK_COND(segdocFF.saveFile(outputDicomFile.c_str(), EXS_LittleEndianExplicit));
      }

      std::cout << "Saved segmentation as " << outputDicomFile << endl;
    }

    for(size_t i=0;i<dcmDatasets.size();i++) {
      delete dcmDatasets[i];
    }
    if (result != NULL)
      delete result;
    return EXIT_SUCCESS;
  } catch (int e) {
    std::cerr << "Fatal error encountered." << std::endl;
  }
  return EXIT_SUCCESS;
}

int main(int argc, char * argv[])
{
  itk::wasm::Pipeline pipeline("write-segmentation", "Write DICOM segmentation object", argc, argv);
  // pipeline.set_version("2.0.0");

  itk::wasm::InputImage<ScalarImageType> inputImage;
  pipeline.add_option("seg-image", inputImage, "dicom segmentation object as an image")->required()->type_name("INPUT_IMAGE");

  itk::wasm::InputTextStream metaInfo;
  pipeline.add_option("meta-info", metaInfo, "JSON file containing the meta-information that describes" \
    "the measurements to be encoded. See DCMQI documentation for details.")->required()->type_name("INPUT_JSON");

  std::string outputDicomFile;
  pipeline.add_option("output-dicom-file", outputDicomFile, "File name of the DICOM SEG object that will store the" \
    "result of conversion.")->required()->type_name("OUTPUT_BINARY_FILE");

  std::vector<std::string> refDicomSeriesFiles;
  pipeline.add_option("-r,--ref-dicom-series", refDicomSeriesFiles, "List of DICOM files that correspond to the original" \
    "image that was segmented.")->required()->check(CLI::ExistingFile)->expected(1,-1)->type_name("INPUT_BINARY_FILE");

  bool skipEmptySlices{true};
  pipeline.add_flag("-s,--skip-empty-slices", skipEmptySlices, "Skip empty slices while encoding segmentation image." \
    "By default, empty slices will not be encoded, resulting in a smaller output file size.");

  bool useLabelIDAsSegmentNumber{false};
  pipeline.add_flag("-l,--use-labelid-as-segmentnumber", useLabelIDAsSegmentNumber, "Use label IDs from ITK images as" \
    "Segment Numbers in DICOM. Only works if label IDs are consecutively numbered starting from 1, otherwise conversion will fail.");

  ITK_WASM_PARSE(pipeline);

  runPipeline(
    inputImage,
    metaInfo,
    refDicomSeriesFiles,
    outputDicomFile,
    skipEmptySlices,
    useLabelIDAsSegmentNumber
  );
}
