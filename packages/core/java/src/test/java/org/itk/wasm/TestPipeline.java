/*-
 * #%L
 * Java bindings for itk-wasm.
 * %%
 * Copyright (C) 2023 ITK developers.
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */
package org.itk.wasm;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledOnOs;
import org.junit.jupiter.api.condition.OS;

public class TestPipeline {

  private final Path testDataDir;
  private final Path testInputDir;
  private final Path testBaselineDir;

  public TestPipeline() {
    testDataDir = Paths.get("..", "test", "data").toAbsolutePath();
    testInputDir = testDataDir.resolve("input");
    testBaselineDir = testDataDir.resolve("baseline");
  }

  @Test
  public void testStdoutStderr() throws IOException {
    Pipeline pipeline = new Pipeline(testInputDir.resolve("stdout-stderr-test.wasi.wasm").toString());
    pipeline.run(new ArrayList<>());

    // Test re-run
    pipeline.run(new ArrayList<>());
  }

  @Test
  public void testPipelineInputOutputStreams() throws IOException {
  	Pipeline pipeline = new Pipeline(testInputDir.resolve("input-output-files-test.wasi.wasm").toString());

  	List<PipelineInput<?>> pipelineInputs = new ArrayList<>();
  	pipelineInputs.add(new PipelineInput<>(InterfaceType.TextStream, new TextStream("The answer is 42.")));
  	pipelineInputs.add(new PipelineInput<>(InterfaceType.BinaryStream, new BinaryStream(new byte[]{(byte) 222, (byte) 173, (byte) 190, (byte) 239})));

  	List<PipelineOutput<?>> pipelineOutputs = new ArrayList<>();
  	pipelineOutputs.add(new PipelineOutput<>(InterfaceType.TextStream));
  	pipelineOutputs.add(new PipelineOutput<>(InterfaceType.BinaryStream));

  	List<String> args = Arrays.asList(
  		"--memory-io",
  		"--input-text-stream", "0",
  		"--input-binary-stream", "1",
  		"--output-text-stream", "0",
  		"--output-binary-stream", "1"
  	);

  	List<PipelineOutput<?>> outputs = pipeline.run(args, pipelineOutputs, pipelineInputs);

  	// Test re-run
  	outputs = pipeline.run(args, pipelineOutputs, pipelineInputs);

  	assert outputs.get(0).type == InterfaceType.TextStream;
  	assert ((TextStream) outputs.get(0).data).data.equals("The answer is 42.");

  	byte[] binaryData = ((BinaryStream) outputs.get(1).data).data;
  	assert binaryData[0] == (byte) 222;
  	assert binaryData[1] == (byte) 173;
  	assert binaryData[2] == (byte) 190;
  	assert binaryData[3] == (byte) 239;
  }

  @EnabledOnOs({OS.LINUX, OS.MAC}) // Skip this test on Windows platform
  @Test
  public void testPipelineInputOutputFiles() throws IOException {
  	Pipeline pipeline = new Pipeline(testInputDir.resolve("input-output-files-test.wasi.wasm"));
  	Path inputTextFile = testInputDir.resolve("input.txt");
  	Path inputBinaryFile = testInputDir.resolve("input.bin");

  	File outputTextFile = File.createTempFile("output", ".txt");
  	File outputBinaryFile = File.createTempFile("output", ".bin");

  	List<PipelineInput<?>> pipelineInputs = new ArrayList<>();
  	pipelineInputs.add(new PipelineInput<>(InterfaceType.TextFile, new TextFile(inputTextFile)));
  	pipelineInputs.add(new PipelineInput<>(InterfaceType.BinaryFile, new BinaryFile(inputBinaryFile)));

  	List<PipelineOutput<?>> pipelineOutputs = new ArrayList<>();
  	pipelineOutputs.add(new PipelineOutput<>(InterfaceType.TextFile, new TextFile(outputTextFile.toPath())));
  	pipelineOutputs.add(new PipelineOutput<>(InterfaceType.BinaryFile, new BinaryFile(outputBinaryFile.toPath())));

  	List<String> args = Arrays.asList(
  		"--memory-io",
  		"--use-files",
  		"--input-text-file", inputTextFile.toString(),
  		"--input-binary-file", inputBinaryFile.toString(),
  		"--output-text-file", outputTextFile.toString(),
  		"--output-binary-file", outputBinaryFile.toString()
  	);

  	List<PipelineOutput<?>> outputs = pipeline.run(args, pipelineOutputs, pipelineInputs);

  	// Test re-run
  	outputs = pipeline.run(args, pipelineOutputs, pipelineInputs);

  	assert outputs.get(0).type == InterfaceType.TextFile;
  	PurePosixPath outputPath1 = ((TextFile) outputs.get(0).data).path;
  	String content1 = IO.readString(outputPath1.toString());
  	assert content1.equals("The answer is 42.");

  	assert outputs.get(1).type == InterfaceType.BinaryFile;
  	PurePosixPath outputPath2 = ((BinaryFile) outputs.get(1).data).path;
  	byte[] content2 = IO.readBytes(outputPath2.toString());
  	assert content2[0] == (byte) 222;
  	assert content2[1] == (byte) 173;
  	assert content2[2] == (byte) 190;
  	assert content2[3] == (byte) 239;
  }

  /*
  @Test
  public void testPipelineWriteReadImage() throws IOException {
  	Pipeline pipeline = new Pipeline(testInputDir.resolve("median-filter-test.wasi.wasm"));

  	Path data = testInputDir.resolve("cthead1.png");
  	itk.Image itkImage = itk.imread(data, itk.UC);
  	Map<String, Object> itkImageDict = itk.dict_from_image(itkImage);
  	Image itkwasmImage = new Image(itkImageDict);

  	List<PipelineInput<?>> pipelineInputs = new ArrayList<>();
  	pipelineInputs.add(new PipelineInput<>(InterfaceTypes.Image, itkwasmImage));

  	List<PipelineOutput<?>> pipelineOutputs = new ArrayList<>();
  	pipelineOutputs.add(new PipelineOutput<>(InterfaceTypes.Image));

  	String[] args = {
  		"--memory-io",
  		"0",
  		"0",
  		"--radius", "2"
  	};

  	List<PipelineOutput<?>> outputs = pipeline.run(args, pipelineOutputs, pipelineInputs);

  	itk.Image outImage = itk.image_from_dict(asdict(outputs.get(0).getData()));
  	// To be addressed in itk-5.3.1
  	outImage.SetRegions(new int[]{256, 256});

  	itk.Image baseline = itk.imread(testBaselineDir.resolve("test_pipeline_write_read_image.png"));

  	double difference = np.sum(itk.comparison_image_filter(outImage, baseline));
  	assert difference == 0.0;
  }

  @Test
  public void testPipelineWriteReadMesh() {
  	Pipeline pipeline = new Pipeline(testInputDir.resolve("mesh-read-write-test.wasi.wasm"));

  	Path data = testInputDir.resolve("cow.vtk");
  	itk.Mesh itkMesh = itk.meshread(data);
  	Map<String, Object> itkMeshDict = itk.dict_from_mesh(itkMesh);
  	Mesh itkwasmMesh = new Mesh(itkMeshDict);

  	List<PipelineInput<?>> pipelineInputs = new ArrayList<>();
  	pipelineInputs.add(new PipelineInput<>(InterfaceTypes.Mesh, itkwasmMesh));

  	List<PipelineOutput<?>> pipelineOutputs = new ArrayList<>();
  	pipelineOutputs.add(new PipelineOutput<>(InterfaceTypes.Mesh));

  	List<String> args = Arrays.asList(
  		"--memory-io",
  		"0",
  		"0"
  	);

  	List<PipelineOutput<?>> outputs = pipeline.run(args, pipelineOutputs, pipelineInputs);

  	Map<String, Object> outMeshDict = asdict(outputs.get(0).data);
  	// Native ITK Python binaries require uint64
  	outMeshDict.put("cells", ((int[]) outMeshDict.get("cells")).astype(np.uint64));
  	outMeshDict.get("meshType").put("cellComponentType", "uint64");
  	itk.Mesh outMesh = itk.mesh_from_dict(outMeshDict);

  	assert outMesh.GetNumberOfPoints() == 2903;
  	assert outMesh.GetNumberOfCells() == 3263;
  }

  @Test
  public void testPipelineWriteReadPolyData() {
  	Pipeline pipeline = new Pipeline(testInputDir.resolve("mesh-to-poly-data.wasi.wasm"));

  	Path data = testInputDir.resolve("cow.vtk");
  	itk.Mesh itkMesh = itk.meshread(data);
  	Map<String, Object> itkMeshDict = itk.dict_from_mesh(itkMesh);
  	Mesh itkwasmMesh = new Mesh(itkMeshDict);

  	List<PipelineInput<?>> pipelineInputs = new ArrayList<>();
  	pipelineInputs.add(new PipelineInput<>(InterfaceTypes.Mesh, itkwasmMesh));

  	List<PipelineOutput<?>> pipelineOutputs = new ArrayList<>();
  	pipelineOutputs.add(new PipelineOutput<>(InterfaceTypes.PolyData));

  	List<String> args = Arrays.asList(
  		"--memory-io",
  		"0",
  		"0"
  	);

  	List<PipelineOutput<?>> outputs = pipeline.run(args, pipelineOutputs, pipelineInputs);
  	PolyData polydata = (PolyData) outputs.get(0).data;

  	pipeline = new Pipeline(testInputDir.resolve("poly-data-to-mesh.wasi.wasm"));

  	pipelineInputs = new ArrayList<>();
  	pipelineInputs.add(new PipelineInput<>(InterfaceTypes.PolyData, polydata));

  	pipelineOutputs = new ArrayList<>();
  	pipelineOutputs.add(new PipelineOutput<>(InterfaceTypes.Mesh));

  	args = Arrays.asList(
  		"--memory-io",
  		"0",
  		"0"
  	);

  	outputs = pipeline.run(args, pipelineOutputs, pipelineInputs);

  	Map<String, Object> outMeshDict = asdict(outputs.get(0).data);

  	// native itk python binaries require uint64
  	outMeshDict.put("cells", ((int[]) outMeshDict.get("cells")).astype(np.uint64));
  	outMeshDict.get("meshType").put("cellComponentType", "uint64");
  	assert np.isclose(outMeshDict.get("points")[0], 3.71636);
  	itk.Mesh outMesh = itk.mesh_from_dict(outMeshDict);

  	assert outMesh.GetNumberOfPoints() == 2903;
  	assert outMesh.GetNumberOfCells() == 3263;
  }
  */
}
