var script = document.createElement("script");
script.src = "https://code.jquery.com/jquery-3.7.1.min.js";

document.getElementsByTagName("head")[0].appendChild(script);




var audio = new Audio(
  "https://commondatastorage.googleapis.com/codeskulptor-assets/jump.ogg"
);

// Check if the button is found
let checkSwap = () => {
  let swapButton = $('button:contains("Swap")');

  if (swapButton.length) {
    console.log("Button found:", swapButton);

    if (
      parseFloat(
        document.querySelectorAll('input[pattern="^[0-9]*[.,]?[0-9]{0,9}$"]')[1]
          .value
      ) > 0.2
    ) {
      clickOnSwap();
    } else {
      setTimeout(checkSwap, 30000);
    }
  } else {
    console.log("Button not found.");
    $('button:contains("Accept")').click();
    setTimeout(checkSwap, 30000);
  }
};

let clickOnSwap = () => {
  audio.play();
  $('button:contains("Swap")').click();
};

setTimeout(() => {
  checkSwap();
}, 5000);
