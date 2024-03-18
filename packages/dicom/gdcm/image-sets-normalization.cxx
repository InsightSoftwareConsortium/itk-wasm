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

#include "itkPipeline.h"
#include "itkOutputTextStream.h"

#include "rapidjson/document.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"

#include "discriminate-volume.cxx"

int main(int argc, char *argv[])
{
  itk::wasm::Pipeline pipeline("image-sets-normalization", "Group DICOM files into image sets", argc, argv);

  std::vector<std::string> files;
  pipeline.add_option("--files", files, "DICOM files")->required()->check(CLI::ExistingFile)->type_size(1, -1)->type_name("INPUT_BINARY_FILE");

  itk::wasm::OutputTextStream imageSetsMetadata;
  pipeline.add_option("image-sets-metadata", imageSetsMetadata, "Image sets JSON")->required()->type_name("OUTPUT_JSON");

  ITK_WASM_PARSE(pipeline);

  gdcm::Scanner s;

  const gdcm::Tag t1(0x0020, 0x000d); // Study Instance UID
  const gdcm::Tag t2(0x0020, 0x000e); // Series Instance UID
  const gdcm::Tag t3(0x0020, 0x0052); // Frame of Reference UID
  const gdcm::Tag t4(0x0020, 0x0037); // Image Orientation (Patient)

  s.AddTag(t1);
  s.AddTag(t2);
  s.AddTag(t3);
  s.AddTag(t4);

  bool b = s.Scan(files);
  if (!b)
  {
    std::cerr << "Scanner failed" << std::endl;
    return 1;
  }

  gdcm::DiscriminateVolume dv;
  dv.ProcessIntoVolume(s);

  std::vector<gdcm::Directory::FilenamesType> sortedFiles = dv.GetSortedFiles();

  rapidjson::Document imageSetsJson;
  rapidjson::Document::AllocatorType &allocator = imageSetsJson.GetAllocator();
  imageSetsJson.SetObject();

  int groupId = 0;
  for (
      std::vector<gdcm::Directory::FilenamesType>::const_iterator fileNames = sortedFiles.begin();
      fileNames != sortedFiles.end(); ++fileNames)
  {
    groupId++;
    rapidjson::Value sortedFileNameArray(rapidjson::kArrayType);

    for (
        gdcm::Directory::FilenamesType::const_iterator fileName = fileNames->begin();
        fileName != fileNames->end(); ++fileName)
    {
      rapidjson::Value fileNameValue;
      fileNameValue.SetString(fileName->c_str(), fileName->size(), allocator);
      sortedFileNameArray.PushBack(fileNameValue, allocator);
    }

    std::string fileName = fileNames->front();
    const char* studyInstanceUID = s.GetValue(fileName.c_str(), t1);

    rapidjson::Value groupIdKey(studyInstanceUID, allocator);
    imageSetsJson.AddMember(groupIdKey, sortedFileNameArray, allocator);
  }

  rapidjson::StringBuffer stringBuffer;
  rapidjson::Writer<rapidjson::StringBuffer> writer(stringBuffer);
  imageSetsJson.Accept(writer);
  imageSetsMetadata.Get() << stringBuffer.GetString();

  return EXIT_SUCCESS;
}
