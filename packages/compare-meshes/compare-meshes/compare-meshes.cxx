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
#include "itkInputMesh.h"
#include "itkOutputTextStream.h"
#include "itkSupportInputMeshTypes.h"

template <typename TMesh>
int compareMeshes(itk::wasm::Pipeline &pipeline, const TMesh *testMesh)
{
  using MeshType = TMesh;
  constexpr unsigned int Dimension = MeshType::PointDimension;
  using PixelType = typename MeshType::PixelType;

  pipeline.get_option("test-mesh")->required()->type_name("INPUT_MESH");

  std::vector<itk::wasm::InputMesh<MeshType>> baselineMeshes;
  pipeline.add_option("--baseline-meshes", baselineMeshes, "Baseline images to compare against")->required()->type_size(1, -1)->type_name("INPUT_MESH");

  double pointsDifferenceThreshold = 1e-8;
  pipeline.add_option("--points-difference-threshold", pointsDifferenceThreshold, "Difference for point components to be considered different.");

  uint64_t numberOfDifferentPointsTolerance = 0;
  pipeline.add_option("--number-of-different-points-tolerance", numberOfDifferentPointsTolerance, "Number of points whose points exceed the difference threshold that can be different before the test fails.");

  double pointDataThreshold = 1e-8;
  pipeline.add_option("--point-data-threshold", pointDataThreshold, "Difference for point data components to be considered different. ");

  uint64_t numberOfPointDataTolerance = 0;
  pipeline.add_option("--number-of-point-data-tolerance", numberOfPointDataTolerance, "Number of point data that can exceed the difference threshold before the test fails.");

  double cellDataThreshold = 1e-8;
  pipeline.add_option("--cell-data-threshold", cellDataThreshold, "Difference for cell data components to be considered different.");

  uint64_t numberOfCellDataTolerance = 0;
  pipeline.add_option("--number-of-cell-data-tolerance", numberOfCellDataTolerance, "Number of cell data that can exceed the difference threshold before the test fails.");

  itk::wasm::OutputTextStream metrics;
  pipeline.add_option("metrics", metrics, "Metrics for the baseline with the fewest number of points outside the tolerances.")->required()->type_name("OUTPUT_JSON");

  ITK_WASM_PARSE(pipeline);

  // Pipeline code goes here

  return EXIT_SUCCESS;
}

template <typename TMesh>
class PipelineFunctor
{
public:
  int operator()(itk::wasm::Pipeline &pipeline)
  {
    using MeshType = TMesh;

    itk::wasm::InputMesh<MeshType> testMesh;
    pipeline.add_option("test-mesh", testMesh, "The input test mesh")->type_name("INPUT_MESH");

    ITK_WASM_PRE_PARSE(pipeline);

    typename MeshType::ConstPointer testMeshRef = testMesh.Get();
    return compareMeshes<MeshType>(pipeline, testMeshRef);
  }
};

int main(int argc, char * argv[])
{
  itk::wasm::Pipeline pipeline("compare-meshes", "Compare meshes with a tolerance for regression testing.", argc, argv);

  return itk::wasm::SupportInputMeshTypes<PipelineFunctor,
    uint8_t, int8_t, uint16_t, int16_t, uint32_t, int32_t, float, double>
    ::Dimensions<2U, 3U>("test-mesh", pipeline);
}
