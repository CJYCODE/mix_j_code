
  var script = document.createElement("script");
  script.src = "https://code.jquery.com/jquery-3.7.1.min.js";

  document.getElementsByTagName("head")[0].appendChild(script);
  
  // Create an Audio object
  var audio = new Audio(
    "https://commondatastorage.googleapis.com/codeskulptor-assets/jump.ogg"
  );

  // Function to play the sound

  function playSound() {
    setTimeout(function () {
      audio.play();
    }, 2000);
  }

  let min_price = 1;
  let max_price = 9999;

  function doPriceCheck() {
    
    let currentPrice = parseFloat($('#price_alert').text().replace("$", ''));

    console.log("doPriceCheck...", currentPrice);

    if (currentPrice < min_price) {
      console.log("<<<<<");
      playSound();
    }

    if (currentPrice > max_price) {
      console.log(">>>>>");
      playSound();
    }
  }

  setInterval(doPriceCheck, 8000);
