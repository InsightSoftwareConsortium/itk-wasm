const interfaceJsonTypeToPythonType = new Map([
  ['INPUT_TEXT_FILE:FILE', 'os.PathLike'],
  ['INPUT_TEXT_FILE', 'os.PathLike'],
  ['OUTPUT_TEXT_FILE:FILE', 'os.PathLike'],
  ['OUTPUT_TEXT_FILE', 'os.PathLike'],
  ['INPUT_BINARY_FILE', 'os.PathLike'],
  ['INPUT_BINARY_FILE:FILE', 'os.PathLike'],
  ['OUTPUT_BINARY_FILE', 'os.PathLike'],
  ['OUTPUT_BINARY_FILE:FILE', 'os.PathLike'],
  ['INPUT_TEXT_STREAM', 'str'],
  ['OUTPUT_TEXT_STREAM', 'str'],
  ['INPUT_BINARY_STREAM', 'bytes'],
  ['OUTPUT_BINARY_STREAM', 'bytes'],
  ['INPUT_IMAGE', 'Image'],
  ['OUTPUT_IMAGE', 'Image'],
  ['INPUT_MESH', 'Mesh'],
  ['OUTPUT_MESH', 'Mesh'],
  ['INPUT_POLYDATA', 'PolyData'],
  ['OUTPUT_POLYDATA', 'PolyData'],
  ['BOOL', 'bool'],
  ['TEXT', 'str'],
  ['INT', 'int'],
  ['INT:INT', 'int'],
  ['UINT', 'int'],
  ['UINT:UINT', 'int'],
  ['FLOAT', 'float'],
  ['FLOAT:FLOAT', 'float'],
  ['INPUT_JSON', 'Any'],
  ['OUTPUT_JSON', 'Any'],
])

export default interfaceJsonTypeToPythonType