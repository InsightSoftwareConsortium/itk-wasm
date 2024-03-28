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
#ifndef SORT_SPATIALLY_H
#define SORT_SPATIALLY_H

#include <string>
#include <unordered_set>

#include "gdcmSerieHelper.h"

class CustomSerieHelper : public gdcm::SerieHelper
{
public:
    void AddFileName(std::string const &fileName)
    {
        SerieHelper::AddFileName(fileName);
    }
};

using FileNamesContainer = std::vector<std::string>;

FileNamesContainer sortSpatially(std::vector<std::string> unsortedSerieFileNames)
{
    std::unique_ptr<CustomSerieHelper> serieHelper(new CustomSerieHelper());
    for (const std::string &fileName : unsortedSerieFileNames)
    {
        serieHelper->AddFileName(fileName);
    }
    serieHelper->SetUseSeriesDetails(true);
    // Add the default restrictions to refine the file set into multiple series.
    serieHelper->CreateDefaultUniqueSeriesIdentifier();
    using SeriesIdContainer = std::vector<std::string>;
    SeriesIdContainer seriesUIDs;
    // Accessing the first serie found (assume there is at least one)
    gdcm::FileList *flist = serieHelper->GetFirstSingleSerieUIDFileSet();
    while (flist)
    {
        if (!flist->empty()) // make sure we have at least one serie
        {
            gdcm::File *file = (*flist)[0]; // for example take the first one

            // Create its unique series ID
            const std::string id(serieHelper->CreateUniqueSeriesIdentifier(file));

            seriesUIDs.push_back(id);
        }
        flist = serieHelper->GetNextSingleSerieUIDFileSet();
    }

    FileNamesContainer fileNames;
    flist = serieHelper->GetFirstSingleSerieUIDFileSet();
    const std::string serie = seriesUIDs[0];
    bool found = false;
    while (flist && !found)
    {
        if (!flist->empty()) // make sure we have at least one serie
        {
            gdcm::File *file = (*flist)[0]; // for example take the first one
            const std::string id(serieHelper->CreateUniqueSeriesIdentifier(file));
            if (id == serie)
            {
                found = true; // we found a match
                break;
            }
        }
        flist = serieHelper->GetNextSingleSerieUIDFileSet();
    }
    serieHelper->OrderFileList(flist);

    gdcm::FileList::iterator it;
    for (it = flist->begin(); it != flist->end(); ++it)
    {
        gdcm::FileWithName *header = *it;
        fileNames.push_back(header->filename);
    }
    return fileNames;
}

#endif // SORT_SPATIALLY_H