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
#include <unordered_set>

#include "rapidjson/document.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"

#include "itkPipeline.h"
#include "itkOutputTextStream.h"

#include "gdcmDiscriminateVolume.h"
#include "DICOMTagReader.h"
#include "Tags.h"
#include "SortSpatially.h"

const std::string STUDY_INSTANCE_UID = "0020|000D";
const std::string SERIES_INSTANCE_UID = "0020|000e";

using File = std::string;
using TagValues = itk::DICOMTagReader::TagMapType;

rapidjson::Value mapToJsonObj(const TagValues &tags, rapidjson::Document::AllocatorType &allocator)
{
  rapidjson::Value json(rapidjson::kObjectType);
  for (const auto &[tag, value] : tags)
  {
    rapidjson::Value tagName;
    tagName.SetString(tag.c_str(), tag.size(), allocator);
    rapidjson::Value tagValue;
    tagValue.SetString(value.c_str(), value.size(), allocator);
    json.AddMember(tagName, tagValue, allocator);
  }
  return json;
}

TagValues filterTags(const TagValues &tags, const Tags &keeperTagKeys)
{
  TagValues filteredTags;
  for (const auto &tagName : keeperTagKeys)
  {
    const auto it = tags.find(tagName);
    if (it != tags.end())
    {
      filteredTags[tagName] = it->second;
    }
  }
  return filteredTags;
}

rapidjson::Value jsonFromTags(const TagValues &tags, const Tags &tagKeys, rapidjson::Document::AllocatorType &allocator)
{
  const TagValues filteredTags = filterTags(tags, tagKeys);
  return mapToJsonObj(filteredTags, allocator);
}

using DicomFile = std::pair<const File, const TagValues>;
struct dicomFileHash
{
  std::size_t operator()(const DicomFile &dFile) const
  {
    return std::hash<File>{}(dFile.first);
  }
};
using DicomFiles = std::unordered_set<DicomFile, dicomFileHash>;

DicomFiles readTags(const std::vector<File> &files)
{
  DicomFiles dicomFiles;
  itk::DICOMTagReader tagReader;
  for (const File &fileName : files)
  {
    if (!tagReader.CanReadFile(fileName))
    {
      throw std::runtime_error("Could not read the input DICOM file: " + fileName);
    }
    tagReader.SetFileName(fileName);
    const TagValues dicomTags = tagReader.ReadAllTags();
    dicomFiles.insert(std::make_pair(fileName, dicomTags));
  }
  return dicomFiles;
}

using Volume = std::vector<DicomFile>;
using Volumes = std::vector<Volume>; // aka ImageSet
using ImageSets = std::vector<Volumes>;

bool compareTags(const TagValues &tags1, const TagValues &tags2, const Tags &tagKeys)
{
  for (const auto &tagKey : tagKeys)
  {
    const auto it1 = tags1.find(tagKey);
    const auto it2 = tags2.find(tagKey);
    if (it1 == tags1.end() || it2 == tags2.end())
    {
      return false;
    }
    if (it1->second != it2->second)
    {
      return false;
    }
  }
  return true;
}

Volumes groupByVolume(const DicomFiles &dicomFiles)
{
  Volumes volumes;
  for (const DicomFile &dicomFile : dicomFiles)
  {
    const auto file = dicomFile.first;
    const auto tags = dicomFile.second;
    auto matchingVolume = std::find_if(volumes.begin(), volumes.end(), [&tags](const Volume &volume)
                                       {
      const DicomFile fileInVolume = *volume.begin();
      const TagValues volumeTags = fileInVolume.second;
      return compareTags(volumeTags, tags, {SERIES_INSTANCE_UID}); });

    if (matchingVolume != volumes.end())
    {
      matchingVolume->push_back(dicomFile);
    }
    else
    {
      Volume newVolume({dicomFile});
      volumes.push_back(newVolume);
    }
  }
  return volumes;
}

ImageSets groupByImageSet(const Volumes &volumes)
{
  ImageSets imageSets;
  for (const Volume &volume : volumes)
  {
    const auto volumeTags = volume.begin()->second;
    auto matchingImageSet = std::find_if(imageSets.begin(), imageSets.end(), [&volumeTags](const Volumes &volumes)
                                         {
      const TagValues imageSetTags = volumes.begin()->begin()->second;
      return compareTags(imageSetTags, volumeTags, {STUDY_INSTANCE_UID}); });
    if (matchingImageSet != imageSets.end())
    {
      matchingImageSet->push_back(volume);
    }
    else
    {
      Volumes newImageSet({volume});
      imageSets.push_back(newImageSet);
    }
  }
  return imageSets;
}

Volumes sortSpatially(Volumes &volumes)
{
  Volumes sortedVolumes;
  for (Volume &volume : volumes)
  {
    std::vector<std::string> unsortedSerieFileNames;
    for (const DicomFile &dicomFile : volume)
    {
      unsortedSerieFileNames.push_back(dicomFile.first);
    }
    std::vector<std::string> sortedFileNames = sortSpatially(unsortedSerieFileNames);

    Volume sorted;
    for (const auto &fileName : sortedFileNames)
    {
      const auto matchingDicomFile = std::find_if(volume.begin(), volume.end(), [&fileName](const DicomFile &dicomFile)
                                                  { return dicomFile.first == fileName; });
      if (matchingDicomFile != volume.end())
      {
        sorted.push_back(*matchingDicomFile);
      }
    }
    sortedVolumes.push_back(sorted);
  }
  return sortedVolumes;
}

rapidjson::Document toJson(const ImageSets &imageSets)
{
  rapidjson::Document imageSetsJson(rapidjson::kArrayType);
  rapidjson::Document::AllocatorType &allocator = imageSetsJson.GetAllocator();
  TagValues dicomTags;
  for (const Volumes &volumes : imageSets)
  {
    rapidjson::Value seriesById(rapidjson::kObjectType);
    for (const Volume &volume : volumes)
    {
      rapidjson::Value instances(rapidjson::kObjectType);
      for (const auto &dicomFile : volume)
      {
        File file = dicomFile.first;
        dicomTags = dicomFile.second;
        // filter out patient, study, series tags
        TagValues instanceTags;
        for (const auto &[tag, value] : dicomTags)
        {
          if (NON_INSTANCE_TAGS.find(tag) == NON_INSTANCE_TAGS.end())
          {
            instanceTags[tag] = value;
          }
        }
        rapidjson::Value instanceTagsJson = mapToJsonObj(instanceTags, allocator);
        rapidjson::Value instance(rapidjson::kObjectType);
        instance.AddMember("DICOM", instanceTagsJson, allocator);

        rapidjson::Value fileNameValue;
        fileNameValue.SetString(file.c_str(), file.size(), allocator);
        rapidjson::Value imageFrame(rapidjson::kObjectType);
        imageFrame.AddMember("ID", fileNameValue, allocator);
        rapidjson::Value imageFrames(rapidjson::kArrayType);
        imageFrames.PushBack(imageFrame, allocator);
        instance.AddMember("ImageFrames", imageFrames, allocator);

        // instance by UID under instances
        TagValues::iterator it = dicomTags.find("0008|0018");
        if (it == dicomTags.end())
        {
          throw std::runtime_error("Instance UID not found in dicomTags");
        }
        const auto tag = it->second;
        rapidjson::Value instanceId;
        instanceId.SetString(tag.c_str(), tag.size(), allocator);
        instances.AddMember(instanceId, instance, allocator);
      }

      // Series
      rapidjson::Value seriesTags = jsonFromTags(dicomTags, SERIES_TAGS, allocator);
      rapidjson::Value series(rapidjson::kObjectType);
      series.AddMember("DICOM", seriesTags, allocator);
      series.AddMember("Instances", instances, allocator);

      int volumeIndex = std::distance(volumes.begin(), std::find(volumes.begin(), volumes.end(), volume));
      const std::string seriesId = dicomTags.at(SERIES_INSTANCE_UID) + '.' + std::to_string(volumeIndex);
      rapidjson::Value seriesIdJson;
      seriesIdJson.SetString(seriesId.c_str(), seriesId.size(), allocator);
      seriesById.AddMember(seriesIdJson, series, allocator);
    }

    rapidjson::Value imageSet(rapidjson::kObjectType);

    // Patient
    rapidjson::Value patient(rapidjson::kObjectType);
    rapidjson::Value patientTags = jsonFromTags(dicomTags, PATIENT_TAGS, allocator);
    patient.AddMember("DICOM", patientTags, allocator);
    imageSet.AddMember("Patient", patient, allocator);

    // Study
    rapidjson::Value study(rapidjson::kObjectType);
    rapidjson::Value studyTagsJson = jsonFromTags(dicomTags, STUDY_TAGS, allocator);
    study.AddMember("DICOM", studyTagsJson, allocator);
    study.AddMember("Series", seriesById, allocator);
    imageSet.AddMember("Study", study, allocator);

    imageSetsJson.PushBack(imageSet, allocator);
  }
  return imageSetsJson;
}

int main(int argc, char *argv[])
{
  itk::wasm::Pipeline pipeline("image-sets-normalization", "Group DICOM files into image sets", argc, argv);

  std::vector<std::string> files;
  pipeline.add_option("--files", files, "DICOM files")->required()->check(CLI::ExistingFile)->type_size(1, -1)->type_name("INPUT_BINARY_FILE");

  itk::wasm::OutputTextStream imageSetsOutput;
  pipeline.add_option("image-sets", imageSetsOutput, "Image sets JSON")->required()->type_name("OUTPUT_JSON");

  ITK_WASM_PARSE(pipeline);

  const DicomFiles dicomFiles = readTags(files);
  Volumes volumes = groupByVolume(dicomFiles);
  volumes = sortSpatially(volumes);
  const ImageSets imageSets = groupByImageSet(volumes);

  rapidjson::Document imageSetsJson = toJson(imageSets);

  rapidjson::StringBuffer stringBuffer;
  rapidjson::Writer<rapidjson::StringBuffer> writer(stringBuffer);
  imageSetsJson.Accept(writer);
  imageSetsOutput.Get() << stringBuffer.GetString();

  return EXIT_SUCCESS;
}
