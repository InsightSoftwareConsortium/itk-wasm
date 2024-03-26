package org.itk.wasm;

import java.util.Map;

public class JsonObject {
    private Map<String, Object> data;

    public JsonObject(Map<String, Object> data) {
        this.data = data;
    }

    public Map<String, Object> getData() {
        return data;
    }

    public void setData(Map<String, Object> data) {
        this.data = data;
    }
}
