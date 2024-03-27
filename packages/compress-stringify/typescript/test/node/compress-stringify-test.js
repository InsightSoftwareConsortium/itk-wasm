import test from "ava";

import {
  compressStringifyNode,
  parseStringDecompressNode,
} from "../../dist/index-node.js";

test("Decompress returns what was compressed", async (t) => {
  const data = new Uint8Array([222, 173, 190, 239]);
  const { output: compressedData } = await compressStringifyNode(data, {
    compressionLevel: 8,
  });
  const { output: decompressedData } =
    await parseStringDecompressNode(compressedData);

  t.is(decompressedData[0], 222);
  t.is(decompressedData[1], 173);
  t.is(decompressedData[2], 190);
  t.is(decompressedData[3], 239);
});

test("We can stringify during compression", async (t) => {
  const data = new Uint8Array([222, 173, 190, 239]);
  const { output: compressedData } = await compressStringifyNode(data, {
    compressionLevel: 8,
    stringify: true,
  });
  const decoder = new TextDecoder();
  t.is(
    decoder.decode(compressedData.buffer),
    "data:application/zstd;base64,KLUv/SAEIQAA3q2+7w==",
  );
  const { output: decompressedData } = await parseStringDecompressNode(
    compressedData,
    { parseString: true },
  );

  t.is(decompressedData[0], 222);
  t.is(decompressedData[1], 173);
  t.is(decompressedData[2], 190);
  t.is(decompressedData[3], 239);
});

test("We can use a custom dataUrlPrefix", async (t) => {
  const data = new Uint8Array([222, 173, 190, 239]);
  const { output: compressedData } = await compressStringifyNode(data, {
    compressionLevel: 8,
    stringify: true,
    dataUrlPrefix: "custom,",
  });
  const decoder = new TextDecoder();
  t.is(decoder.decode(compressedData.buffer), "custom,KLUv/SAEIQAA3q2+7w==");
  const { output: decompressedData } = await parseStringDecompressNode(
    compressedData,
    { parseString: true },
  );

  t.is(decompressedData[0], 222);
  t.is(decompressedData[1], 173);
  t.is(decompressedData[2], 190);
  t.is(decompressedData[3], 239);
});
