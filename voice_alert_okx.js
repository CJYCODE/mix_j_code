var script = document.createElement("script");
script.src = "https://code.jquery.com/jquery-3.7.1.min.js";

document.getElementsByTagName("head")[0].appendChild(script);

// Create an Audio object

var audio = new Audio(
  "https://commondatastorage.googleapis.com/codeskulptor-assets/jump.ogg"
);

// Function to play the sound

function playSound() {
  const element = document.querySelector(
    ".index_number-list__TJjKv.index_opacity__rX6wk.index_number__nLIYo"
  );

  // Extract the value from the element's text content
  const value = parseFloat(element.textContent);
  const targetPrice = 0.038;

  if (value < targetPrice) {
    setTimeout(function () {
      audio.play();
    }, 2000);
  } else {
    console.log("waiting...", value);
  }
}

setInterval(function () {
  playSound();
}, 5000);
