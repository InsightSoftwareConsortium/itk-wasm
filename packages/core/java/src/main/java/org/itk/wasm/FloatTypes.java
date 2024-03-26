package org.itk.wasm;

public enum FloatTypes {
    Float32("float32"),
    Float64("float64"),
    SpacePrecisionType("float64");

    private final String value;

    FloatTypes(String value) {
        this.value = value;
    }

    @Override
    public String toString() {
        return value;
    }
}
