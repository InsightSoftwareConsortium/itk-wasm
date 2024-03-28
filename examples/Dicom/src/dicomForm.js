
function setupDicomForm(patients, callback) {
  const patientSelect = document.getElementById("patientSelect")
  const studySelect = document.getElementById("studySelect")
  const serieSelect = document.getElementById("serieSelect")

  // Remove options
  var patientList = []
  var studyList = []
  var serieList = []
  patientSelect.length = 1;

  // Add patients
  for (const key in patients) {
    const patient = patients[key]
    patientList.push(patient)
    const value = patient.metaData.PatientName + " - " + patient.metaData.PatientBirthDate
    patientSelect.options[patientSelect.options.length] = new Option(value, value);
  }

  patientSelect.onchange = function () {
    // Remove options
    studyList = []
    serieList = []
    studySelect.length = 1;
    serieSelect.length = 1;

    if (this.selectedIndex < 1) return; // done

    // Add underneath studies
    const patientId = this.selectedIndex - 1
    const patient = patientList[patientId]
    for (const key in patient.studies) {
      const study = patient.studies[key]
      studyList.push(study)
      const value = study.metaData.StudyDescription + " - " + study.metaData.StudyDate
      studySelect.options[studySelect.options.length] = new Option(value, value);
    }

    if (studyList.length === 1) {
      studySelect.selectedIndex = 1
      studySelect.onchange()
    }
  }

  studySelect.onchange = function () {
    // Remove options
    serieList = []
    serieSelect.length = 1;

    if (this.selectedIndex < 1) return; // done

    // Add underneath series
    const studyId = this.selectedIndex - 1
    const study = studyList[studyId]
    for (const key in study.series) {
      const serie = study.series[key]
      serieList.push(serie)
      const value = serie.metaData.SeriesDescription + " - " + serie.metaData.Modality
      serieSelect.options[serieSelect.options.length] = new Option(value, value);
    }

    if (serieList.length === 1) {
      serieSelect.selectedIndex = 1
      serieSelect.onchange()
    }
  }

  serieSelect.onchange = function () {
    if (this.selectedIndex < 1) return; // done

    // Return files for serie
    const serieId = this.selectedIndex - 1
    const serie = serieList[serieId]
    callback(serie)
  }

  if (patientList.length === 1) {
    patientSelect.selectedIndex = 1
  }
  patientSelect.onchange(); // reset in case page is reloaded
}

export default setupDicomForm;