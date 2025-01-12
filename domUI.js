window.DOMUI = (function () {
  let selectedValue = "E1M1";

  function init(onFileSelected, onLevelSelected) {
    const levelSelect = document.getElementById("levels");
    levelSelect.addEventListener("change", function () {
      selectedValue = this.value;
      console.log("Selected level:", selectedValue);

      if (onLevelSelected) {
        onLevelSelected(selectedValue);
      }
    });

    document
      .getElementById("fileInput")
      .addEventListener("change", function (event) {
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

  return { init: init };
})();
