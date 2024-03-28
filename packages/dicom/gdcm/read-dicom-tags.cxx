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
#include <algorithm>
#include <fstream>
#include <iostream>
#include <memory>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>
#include <string.h>

#include <iconv.h>

#include "rapidjson/document.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"

#include "itkCommonEnums.h"
#include "itkGDCMImageIO.h"
#include "itkGDCMSeriesFileNames.h"
#include "itkImageIOBase.h"
#include "itkMetaDataObject.h"

#include "itkPipeline.h"
#include "itkInputTextStream.h"
#include "itkOutputTextStream.h"

#include "DICOMTagReader.h"

int main( int argc, char * argv[] )
{
  itk::wasm::Pipeline pipeline("read-dicom-tags", "Read the tags from a DICOM file", argc, argv);

  std::string dicomFile;
  pipeline.add_option("dicom-file", dicomFile, "Input DICOM file.")->required()->check(CLI::ExistingFile)->type_name("INPUT_BINARY_FILE");

  itk::wasm::InputTextStream tagsToReadStream;
  pipeline.add_option("--tags-to-read", tagsToReadStream, "A JSON object with a \"tags\" array of the tags to read. If not provided, all tags are read. Example tag: \"0008|103e\".")->type_name("INPUT_JSON");

  itk::wasm::OutputTextStream tagsStream;
  pipeline.add_option("tags", tagsStream, "Output tags in the file. JSON object an array of [tag, value] arrays. Values are encoded as UTF-8 strings.")->required()->type_name("OUTPUT_JSON");

  ITK_WASM_PARSE(pipeline);

  itk::DICOMTagReader dicomTagReader;

  dicomTagReader.SetFileName(dicomFile);
  if (!dicomTagReader.CanReadFile(dicomFile))
  {
    std::cerr << "Could not read the input DICOM file" << std::endl;
    return EXIT_FAILURE;
  }

  if (tagsToReadStream.GetPointer() == nullptr)
  {
    const auto dicomTags = dicomTagReader.ReadAllTags();

    rapidjson::Document tagsArray;
    tagsArray.SetArray();
    rapidjson::Document::AllocatorType& allocator = tagsArray.GetAllocator();
    for (const auto& [tag, value] : dicomTags) {
      rapidjson::Value tagArray(rapidjson::kArrayType);

      rapidjson::Value tagName;
      tagName.SetString(tag.c_str(), allocator);
      tagArray.PushBack(tagName, allocator);

      rapidjson::Value tagValue;
      tagValue.SetString(value.c_str(), allocator);
      tagArray.PushBack(tagValue, allocator);

      tagsArray.PushBack(tagArray.Move(), allocator);
    }

    rapidjson::StringBuffer stringBuffer;
    rapidjson::Writer<rapidjson::StringBuffer> writer(stringBuffer);
    tagsArray.Accept(writer);

    tagsStream.Get() << stringBuffer.GetString();
  }
  else
  {
    rapidjson::Document inputTagsDocument;
    const std::string inputTagsString((std::istreambuf_iterator<char>(tagsToReadStream.Get())),
                                       std::istreambuf_iterator<char>());
    if (inputTagsDocument.Parse(inputTagsString.c_str()).HasParseError())
      {
      CLI::Error err("Runtime error", "Could not parse input tags JSON.", 1);
      return pipeline.exit(err);
      }
    if (!inputTagsDocument.HasMember("tags"))
      {
      CLI::Error err("Runtime error", "Input tags does not have expected \"tags\" member", 1);
      return pipeline.exit(err);
      }

    rapidjson::Document tagsArray;
    tagsArray.SetArray();
    rapidjson::Document::AllocatorType& allocator = tagsArray.GetAllocator();
    const rapidjson::Value & inputTagsArray = inputTagsDocument["tags"];

    for( rapidjson::Value::ConstValueIterator itr = inputTagsArray.Begin(); itr != inputTagsArray.End(); ++itr )
    {
      rapidjson::Value tagArray(rapidjson::kArrayType);

      const std::string tagString(itr->GetString());
      rapidjson::Value tagName;
      tagName.SetString(tagString.c_str(), allocator);
      tagArray.PushBack(tagName, allocator);

      rapidjson::Value tagValue;
      std::string tagLower(tagString);
      std::transform(tagLower.begin(), tagLower.end(), tagLower.begin(), ::tolower);
      tagValue.SetString(dicomTagReader.ReadTag(tagLower).c_str(), allocator);
      tagArray.PushBack(tagValue, allocator);

      tagsArray.PushBack(tagArray.Move(), allocator);
    }

    rapidjson::StringBuffer stringBuffer;
    rapidjson::Writer<rapidjson::StringBuffer> writer(stringBuffer);
    tagsArray.Accept(writer);

    tagsStream.Get() << stringBuffer.GetString();
  }

  return EXIT_SUCCESS;
}