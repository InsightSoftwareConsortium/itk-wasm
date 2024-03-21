add_executable(compare-meshes compare-meshes.cxx)
target_link_libraries(compare-meshes PUBLIC ${ITK_LIBRARIES})

add_test(NAME compare-meshes-help COMMAND compare-meshes --help)
