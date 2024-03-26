package org.itk.wasm;

import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public final class IO {

	public IO() { }

  public static byte[] readBytes(String path) throws IOException {
    //try (InputStream is = Main.class.getResourceAsStream(filename)) {
    try (InputStream is = new FileInputStream(path)) {
      ByteArrayOutputStream buffer = new ByteArrayOutputStream();
      int nRead;
      byte[] buf = new byte[16384];
      while ((nRead = is.read(buf, 0, buf.length)) != -1) {
        buffer.write(buf, 0, nRead);
      }
      return buffer.toByteArray();
    }
  }

  public static String readString(String path) throws IOException {
  	return new String(readBytes(path), StandardCharsets.UTF_8);
  }
}
