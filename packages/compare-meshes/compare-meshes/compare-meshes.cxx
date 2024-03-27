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

#include "itksys/SystemTools.hxx"

#include <tuple>

template <typename TMesh>
std::tuple<bool, uint64_t, double, double, double>
comparePoints(typename TMesh::PointsContainerPointer points0, typename TMesh::PointsContainerPointer points1, const double pointsDifferenceTolerance)
{
  using MeshType = TMesh;
  using PointsContainerConstIterator = typename MeshType::PointsContainerConstIterator;

  bool sameNumberOfPoints = false;
  uint64_t numberOfPointsWithDifferences = 0;
  double pointsMinimumDifference = itk::NumericTraits<double>::max();
  double pointsMaximumDifference = 0.0;
  double pointsMeanDifference = 0.0;

  if (points0.IsNotNull() && points1.IsNotNull())
  {
    if (points0->Size() == points1->Size())
    {
      sameNumberOfPoints = true;

      PointsContainerConstIterator pt0 = points0->Begin();
      PointsContainerConstIterator pt1 = points1->Begin();

      while ((pt0 != points0->End()) && (pt1 != points1->End()))
      {
        const auto difference = pt0.Value().SquaredEuclideanDistanceTo(pt1.Value());
        if (difference > pointsDifferenceTolerance)
        {
          ++numberOfPointsWithDifferences;
          pointsMinimumDifference = std::min(pointsMinimumDifference, difference);
          pointsMaximumDifference = std::max(pointsMaximumDifference, difference);
          pointsMeanDifference += difference;
        }
        ++pt0;
        ++pt1;
      }

      pointsMeanDifference /= points0->Size();
    }
  }
  else
  {
    if (points0 == points1.GetPointer())
    {
      sameNumberOfPoints = true;
      pointsMinimumDifference = 0.0;
    }
  }

  return { sameNumberOfPoints, numberOfPointsWithDifferences, pointsMinimumDifference, pointsMaximumDifference, pointsMeanDifference };
}

template <typename TMesh>
int
TestCellsContainer(typename TMesh::CellsContainerPointer cells0, typename TMesh::CellsContainerPointer cells1)
{
  using MeshType = TMesh;
  using CellsContainerConstIterator = typename MeshType::CellsContainerConstIterator;
  using CellPointIdIterator = typename MeshType::CellType::PointIdIterator;

  if (cells0.IsNotNull() && cells1.IsNotNull())
  {
    if (cells0->Size() != cells1->Size())
    {
      std::cerr << "Input mesh and output mesh have different number of cells!" << std::endl;
      return EXIT_FAILURE;
    }
    CellsContainerConstIterator ceIt0 = cells0->Begin();
    CellsContainerConstIterator ceIt1 = cells1->Begin();

    while ((ceIt0 != cells0->End()) && (ceIt1 != cells1->End()))
    {
      if (ceIt0.Value()->GetType() != ceIt1.Value()->GetType())
      {
        std::cerr << "Input mesh and output mesh are different in cell type!" << std::endl;
        return EXIT_FAILURE;
      }
      if (ceIt0.Index() != ceIt1.Index())
      {
        std::cerr << "Input mesh and output mesh have different cell IDs" << std::endl;
        std::cerr << "Input mesh cell ID: " << ceIt0.Index() << std::endl;
        std::cerr << "Output mesh cell ID: " << ceIt1.Index() << std::endl;
        return EXIT_FAILURE;
      }
      CellPointIdIterator pit0 = ceIt0.Value()->PointIdsBegin();
      CellPointIdIterator pit1 = ceIt1.Value()->PointIdsBegin();
      while (pit0 != ceIt0.Value()->PointIdsEnd())
      {
        if (*pit0 != *pit1)
        {
          std::cerr << "Input mesh and output mesh are different in cells!" << std::endl;
          return EXIT_FAILURE;
        }
        ++pit0;
        ++pit1;
      }
      ++ceIt0;
      ++ceIt1;
    }
  }
  else
  {
    if (cells0 != cells1.GetPointer())
    {
      std::cerr << "Input mesh and output mesh are different in cells!" << std::endl;
      std::cerr << "cells0 = " << cells0.GetPointer() << std::endl;
      std::cerr << "cells1 = " << cells1.GetPointer() << std::endl;
      return EXIT_FAILURE;
    }
  }

  return EXIT_SUCCESS;
}

template <typename TMesh>
int
TestPointDataContainer(typename TMesh::PointDataContainerPointer pointData0,
                       typename TMesh::PointDataContainerPointer pointData1)
{
  using MeshType = TMesh;
  using PointDataContainerIterator = typename MeshType::PointDataContainerIterator;

  if (pointData0.IsNotNull() && pointData1.IsNotNull())
  {
    if (pointData0->Size() != pointData1->Size())
    {
      std::cerr << "Input mesh and output mesh have different number of point data!" << std::endl;
      return EXIT_FAILURE;
    }
    PointDataContainerIterator pdIt0 = pointData0->Begin();
    PointDataContainerIterator pdIt1 = pointData1->Begin();

    while ((pdIt0 != pointData0->End()) && (pdIt1 != pointData1->End()))
    {
      if (pdIt0->Index() != pdIt1->Index())
      {
        std::cerr << "Input mesh and output mesh are different in point data!" << std::endl;
        std::cerr << "Input point ID  = " << pdIt0.Index() << std::endl;
        std::cerr << "Output point ID = " << pdIt1.Index() << std::endl;
        return EXIT_FAILURE;
      }
      if (itk::Math::NotExactlyEquals(pdIt0.Value(), pdIt1.Value()))
      {
        std::cerr << "Input mesh and output mesh are different in point data!" << std::endl;
        std::cerr << "Input = " << pdIt0.Value() << std::endl;
        std::cerr << "Output = " << pdIt1.Value() << std::endl;
        return EXIT_FAILURE;
      }
      ++pdIt0;
      ++pdIt1;
    }
  }
  else
  {
    if (pointData0 != pointData1.GetPointer())
    {
      std::cerr << "Input mesh and output mesh are different in point data!" << std::endl;
      std::cerr << "pointData0 = " << pointData0.GetPointer() << std::endl;
      std::cerr << "pointData1 = " << pointData1.GetPointer() << std::endl;
      return EXIT_FAILURE;
    }
  }
  return EXIT_SUCCESS;
}

template <typename TMesh>
int
TestCellDataContainer(typename TMesh::CellDataContainerPointer cellData0,
                      typename TMesh::CellDataContainerPointer cellData1)
{
  using MeshType = TMesh;
  using CellDataContainerIterator = typename MeshType::CellDataContainerIterator;

  if (cellData0.IsNotNull() && cellData1.IsNotNull())
  {
    if (cellData0->Size() != cellData1->Size())
    {
      std::cerr << "Input mesh and output mesh have different number of cell data!" << std::endl;
      return EXIT_FAILURE;
    }

    CellDataContainerIterator cdIt0 = cellData0->Begin();
    CellDataContainerIterator cdIt1 = cellData1->Begin();
    while (cdIt0 != cellData0->End())
    {
      if (cdIt0->Index() != cdIt1->Index())
      {
        std::cerr << "Input mesh and output mesh are different in cell data!" << std::endl;
        std::cerr << "Input cell ID  = " << cdIt0.Index() << std::endl;
        std::cerr << "Output cell ID = " << cdIt1.Index() << std::endl;
        return EXIT_FAILURE;
      }
      if (itk::Math::NotExactlyEquals(cdIt0.Value(), cdIt1.Value()))
      {
        std::cerr << "Input mesh and output mesh are different in cell data!" << std::endl;
        std::cerr << "Input = " << cdIt0.Value() << std::endl;
        std::cerr << "Output = " << cdIt1.Value() << std::endl;
        return EXIT_FAILURE;
      }
      ++cdIt0;
      ++cdIt1;
    }
  }
  else
  {
    if (cellData0 != cellData1.GetPointer())
    {
      std::cerr << "Input mesh and output mesh are different in cell data!" << std::endl;
      std::cerr << "pointData0 = " << cellData0.GetPointer() << std::endl;
      std::cerr << "pointData1 = " << cellData1.GetPointer() << std::endl;
      return EXIT_FAILURE;
    }
  }
  return EXIT_SUCCESS;
}

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
  pipeline.add_option("metrics", metrics, "Metrics for the closest baseline.")->required()->type_name("OUTPUT_JSON");

  ITK_WASM_PARSE(pipeline);

  bool almostEqual = false;

  bool sameNumberOfPoints = false;
  uint64_t numberOfPointsWithDifferences = itk::NumericTraits<uint64_t>::max();
  double pointsMinimumDifference = 0.0;
  double pointsMaximumDifference = 0.0;
  double pointsTotalDifference = 0.0;
  double pointsMeanDifference = 0.0;

  bool sameNumberOfCells = false;
  bool sameCellTypes = false;
  uint64_t numberOfDifferentCellsTypes = itk::NumericTraits<uint64_t>::max();
  bool sameCellPoints = false;
  uint64_t numberOfDifferentCellPoints = itk::NumericTraits<uint64_t>::max();

  for (unsigned int baselineIndex = 0; baselineIndex < baselineMeshes.size(); ++baselineIndex)
  {
    const auto [
      baselineSameNumberOfPoints,
      baselineNumberOfPointsWithDifferences,
      baselinePointsMinimumDifference,
      baselinePointsMaximumDifference,
      baselinePointsMeanDifference
      ] = comparePoints(testMesh->GetPoints(), baselineMeshes[baselineIndex].Get()->GetPoints(), pointsDifferenceTolerance);
  }


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
