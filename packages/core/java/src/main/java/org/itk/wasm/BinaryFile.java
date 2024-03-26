package org.itk.wasm;

import java.nio.file.Path;

public class BinaryFile {
	public PurePosixPath path;

	public BinaryFile(PurePosixPath path) {
		this.path = path;
	}

	public BinaryFile(Path path) {
		this(new PurePosixPath(path));
	}
}
