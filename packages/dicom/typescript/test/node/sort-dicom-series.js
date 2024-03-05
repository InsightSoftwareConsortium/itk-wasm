import test from "ava";
import path from "path";
import glob from "glob";

import { sortDicomSeriesNode } from "../../dist/index-node.js";

const testDataInputDirectory = path.resolve("..", "test", "data", "input");
const testSeriesDirectory = path.resolve(
  testDataInputDirectory,
  "DicomImageOrientationTest",
);
const testDicomSeriesFiles = glob.sync(`${testSeriesDirectory}/*.dcm`);

test("Test reading a DICOM file", async (t) => {
  const { volumes } = await sortDicomSeriesNode({
    files: testDicomSeriesFiles,
  });
  t.assert(!!volumes);
});
