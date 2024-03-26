package org.itk.wasm;

public class ImageType {
	public int dimension;
	public IntTypes componentType;
	public PixelType pixelType;
	public int components;

	public ImageType() {
		this.dimension = 2;
		this.componentType = IntTypes.UInt8;
		this.pixelType = PixelType.Scalar;
		this.components = 1;
	}

	// Add getters and setters for the fields
}
