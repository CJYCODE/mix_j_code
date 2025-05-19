var script = document.createElement('script'); script.src = "https://code.jquery.com/jquery-3.7.1.min.js";


document.getElementsByTagName('head')[0].appendChild(script);

 

// Create an Audio object


var audio = new Audio('https://commondatastorage.googleapis.com/codeskulptor-assets/jump.ogg');

 

// Function to play the sound


function playSound() {


    if(Boolean($('footer.flex button').length>0)) {


      

        setTimeout(function() {
            $('footer.flex button').click()
        }, 100)

        setTimeout(function() {
            audio.play();
            $('.inscribe_contentFooter__BzYUp button').click()
        }, 2000)


    } else {


        console.log('waiting...')


    }


}

 

setInterval(function() {


    playSound()


},5000)