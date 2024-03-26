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
import java.nio.file.Path;
import java.nio.file.Paths;

public class PurePosixPath {
  public Path path;

  public PurePosixPath(Path path) {
    this.path = path;
  }
  public PurePosixPath(String path) {
    this.path = Paths.get(path);
  }
  public PurePosixPath(File path) {
    this.path = path.toPath();
  }

  public PurePosixPath getParent() {
  	return new PurePosixPath(path.getParent());
  }

  @Override
  public String toString() {
  	// TODO: Ensure path string conforms to POSIX requirements.
  	return path.toString();
  }
}
