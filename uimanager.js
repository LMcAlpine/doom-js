export function initDOM(onFileSelected, onLevelSelected) {
  let selectedValue = "E1M1";

  // Setup the level dropdown
  const levelSelect = document.getElementById("levels");
  levelSelect.addEventListener("change", function () {
    selectedValue = this.value;
    console.log("Selected level:", selectedValue);
    if (onLevelSelected) {
      onLevelSelected(selectedValue);
    }
  });

  // Setup the file input
  const fileInput = document.getElementById("fileInput");
  fileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) {
      console.error("No file selected.");
      return;
    }
    if (onFileSelected) {
      onFileSelected(file);
    }
  });
}
