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

import io.github.kawamuray.wasmtime.Config;
import io.github.kawamuray.wasmtime.Engine;
import io.github.kawamuray.wasmtime.Extern;
import io.github.kawamuray.wasmtime.Linker;
import io.github.kawamuray.wasmtime.Module;
import io.github.kawamuray.wasmtime.Store;
import io.github.kawamuray.wasmtime.WasmFunctions;
import io.github.kawamuray.wasmtime.WasmFunctions.Consumer0;
import io.github.kawamuray.wasmtime.wasi.WasiCtx;
import io.github.kawamuray.wasmtime.wasi.WasiCtxBuilder;

import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

public class Main {
  public static void main(String... args) throws IOException {
    // Configure the initial compilation environment, creating the global
    // `Store` structure. Note that you can also tweak configuration settings
    // with a `Config` and an `Engine` if desired.
    System.err.println("Initializing...");
    Config config = new Config();
    try (
    		Engine engine = new Engine(config);
        Linker linker = new Linker(engine);
        Module module = Module.fromBinary(engine, readBytes("../test/data/input/stdout-stderr-test.wasi.wasm")))
    {
      // Here we handle the imports of the module, which in this case is our
      // `HelloCallback` type and its associated implementation of `Callback.
      System.err.println("Creating callback...");

      WasiCtx wasi = new WasiCtxBuilder().inheritStdout().inheritStderr().build();
      Store<Void> store = new Store<>(null, engine, wasi);
      WasiCtx.addToLinker(linker);
      String moduleName = "this-can-be-anything";
      linker.module(store, moduleName, module);
      Extern extern = linker.get(store, moduleName, "").get();
      Consumer0 doWork = WasmFunctions.consumer(store, extern.func());
      doWork.accept();
    }
  }

  private static byte[] readBytes(String filename) throws IOException {
  	//try (InputStream is = Main.class.getResourceAsStream(filename)) {
  	try (InputStream is = new FileInputStream(filename)) {
  		ByteArrayOutputStream buffer = new ByteArrayOutputStream();
  		int nRead;
  		byte[] buf = new byte[16384];
  		while ((nRead = is.read(buf, 0, buf.length)) != -1) {
  			buffer.write(buf, 0, nRead);
  		}
  		return buffer.toByteArray();
  	}
  }
}
