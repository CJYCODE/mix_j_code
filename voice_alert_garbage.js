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

function checkTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const currentTime = `${hours}:${minutes}`;

  // Calculate trigger time, 10 minutes earlier
  
  const triggerTime = $(".timebox div span").text().split("~")[0];
  const [triggerHours, triggerMinutes] = triggerTime.split(":");
  const triggerDateTime = new Date();
  triggerDateTime.setHours(parseInt(triggerHours, 10));
  // 可調整   -10 就是提前10分鐘響鈴
  triggerDateTime.setMinutes(parseInt(triggerMinutes, 10) - 10);
  const triggerTimeFormatted = `${triggerDateTime
    .getHours()
    .toString()
    .padStart(2, "0")}:${triggerDateTime
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  
  if (currentTime.replace(":", "") > triggerTimeFormatted.replace(":", "")) {
    console.log("Yes yoyo");
    playSound()
    // Perform your action here
  } else {
    console.log(currentTime, triggerTimeFormatted);
  }
}

setInterval(checkTime, 15000);
