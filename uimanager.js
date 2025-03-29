export function initDOM(onFileSelected, onLoadLevelClicked) {
  const gameSelect = document.getElementById("games");
  console.log(gameSelect);

  let chosenLevel;

  gameSelect.addEventListener("change", function () {
    const chosenGame = gameSelect.value;
    console.log(chosenGame);

    if (chosenGame === "DOOM1") {
      const levelSelectD1 = document.getElementById("selectorD1");

      levelSelectD1.style.visibility = "visible";
      chosenLevel = document.getElementById("levels").value
    }
    if (chosenGame === "DOOM2") {
      console.log("HERE");
      const levelSelectD2 = document.getElementById("selectorD2");
      console.log(levelSelectD2);
      levelSelectD2.style.visibility = "visible";
      chosenLevel = document.getElementById("levelsD2").value
    }
  });

  // Setup the level dropdown
  // const levelSelect = document.getElementById("levels");

  const loadLevelBtn = document.getElementById("loadLevelBtn");
  loadLevelBtn.addEventListener("click", function () {
    if (onLoadLevelClicked) {
      onLoadLevelClicked(chosenLevel);
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
