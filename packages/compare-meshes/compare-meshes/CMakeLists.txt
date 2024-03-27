add_executable(compare-meshes compare-meshes.cxx)
target_link_libraries(compare-meshes PUBLIC ${ITK_LIBRARIES})

add_test(NAME compare-meshes-help COMMAND compare-meshes --help)

add_test(NAME compare-meshes-same
  COMMAND compare-meshes
  ${CMAKE_CURRENT_SOURCE_DIR}/../test/data/input/cow.iwm.cbor
  same-metrics.json
  --baseline-meshes ${CMAKE_CURRENT_SOURCE_DIR}/../test/data/input/cow.iwm.cbor
  )
