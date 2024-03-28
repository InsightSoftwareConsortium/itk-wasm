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
#ifndef TAGS_H
#define TAGS_H

#include <string>
#include <unordered_set>

using Tags = std::unordered_set<std::string>;

const Tags PATIENT_TAGS = {
    "0010|0010", // Patient's Name
    "0010|0020", // Patient ID
    "0010|0030", // Patient's Birth Date
    "0010|0040", // Patient's Sex
    "0010|1010", // Patient's Age
    "0010|1030", // Patient's Weight
    "0010|21b0", // Additional Patient's History
};

const Tags STUDY_TAGS = {
    "0020|000D", // Study Instance UID
    "0008|0020", // Study Date
    "0008|0030", // Study Time
    "0008|1030", // Study Description
    "0008|0050", // Accession Number
};

const Tags SERIES_TAGS = {
    "0020|000e", // Series Instance UID
    "0008|103e", // Series Description
    "0008|0060", // Modality
};

const Tags NON_INSTANCE_TAGS = {
    "0010|0010", // Patient's Name
    "0010|0020", // Patient ID
    "0010|0030", // Patient's Birth Date
    "0010|0040", // Patient's Sex
    "0010|1010", // Patient's Age
    "0010|1030", // Patient's Weight
    "0010|21b0", // Additional Patient's History
    "0020|000D", // Study Instance UID
    "0008|0020", // Study Date
    "0008|0030", // Study Time
    "0008|1030", // Study Description
    "0008|0050", // Accession Number
    "0020|000e", // Series Instance UID
    "0008|103e", // Series Description
    "0008|0060", // Modality
};

#endif // TAGS_H