export function initDOM(onFileSelected, onLoadLevelClicked) {
  // Setup the level dropdown
  const levelSelect = document.getElementById("levels");

  const loadLevelBtn = document.getElementById("loadLevelBtn");
  loadLevelBtn.addEventListener("click", function () {
    if (onLoadLevelClicked) {
      onLoadLevelClicked(levelSelect.value);
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
