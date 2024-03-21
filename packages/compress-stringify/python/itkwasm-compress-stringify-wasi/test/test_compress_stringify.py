from itkwasm_compress_stringify_wasi import compress_stringify, parse_string_decompress

def test_decompress_returns_what_was_compressed():
    data = bytes([222, 173, 190, 239])
    compressed_data = compress_stringify(data, compression_level=8)
    decompressed_data = parse_string_decompress(compressed_data)

    assert decompressed_data[0] == 222
    assert decompressed_data[1] == 173
    assert decompressed_data[2] == 190
    assert decompressed_data[3] == 239

def test_we_can_stringify_during_compression():
    data = bytes([222, 173, 190, 239])
    compressed_data = compress_stringify(data, compression_level=8, stringify=True)
    assert compressed_data.decode() == 'data:application/zstd;base64,KLUv/SAEIQAA3q2+7w=='
    decompressed_data = parse_string_decompress(compressed_data, parse_string=True)

    assert decompressed_data[0] == 222
    assert decompressed_data[1] == 173
    assert decompressed_data[2] == 190
    assert decompressed_data[3] == 239

def test_we_can_use_a_custom_data_url_prefix():
    data = bytes([222, 173, 190, 239])
    compressed_data = compress_stringify(data, compression_level=8, stringify=True, data_url_prefix='custom,')
    assert compressed_data.decode() == 'custom,KLUv/SAEIQAA3q2+7w=='
    decompressed_data = parse_string_decompress(compressed_data, parse_string=True)

    assert decompressed_data[0] == 222
    assert decompressed_data[1] == 173
    assert decompressed_data[2] == 190
    assert decompressed_data[3] == 239