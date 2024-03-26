package org.itk.wasm;

import java.nio.file.Path;

public class TextFile {
	public PurePosixPath path;

	public TextFile(PurePosixPath path) {
		this.path = path;
	}

	public TextFile(Path path) {
		this(new PurePosixPath(path));
	}
}
