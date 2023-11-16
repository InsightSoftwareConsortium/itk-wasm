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
#include "itkPipeline.h"
#include "itkInputTextStream.h"
#include "itkOutputTextStream.h"

int main (int argc, char * argv[])
{
  itk::wasm::Pipeline pipeline("sort-dicom-series", "Sort a DICOM image series their spatial order and spatial metadata.", argc, argv);

  itk::wasm::InputTextStream dicomSeries;

  itk::wasm::OutputTextStream imageInformation;;

  ITK_WASM_PARSE(pipeline);

  // { order: [1.0, 2.0, 3.0], origin: [0.0, 0.0, 0.0], spacing: [1.0, 1.0, 1.0], direction: [1.0, 0.0, 0.0, 0.0, 1.0, 0.0] }

  return EXIT_SUCCESS;
}
