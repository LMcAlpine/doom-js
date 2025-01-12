export function initializeDOMEvents(onFileSelected, onLevelSelected) {
  const fileInput = document.getElementById("fileInput");
  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    onFileSelected(file);
  });

  const levelSelect = document.getElementById("levels");
  levelSelect.addEventListener("change", function () {
    onLevelSelected(this.value);
  });
}
