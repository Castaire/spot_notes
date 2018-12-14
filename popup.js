'use strict';

// USAGE:   modifies popup text according to received user-login status
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    switch(request.status){

        case "sucessfulLogin":
            notificationT.textContent = "WHOO! Successfully logged-in with Spotify!";
            authButton.textContent = "Disconnect from Spotify'";
            break;

        case "unsucessfulLogin":
            notificationT.textContent = "Hmmm, something happened. Wanna try again?";
            authButton.textContent = "Reconnect with Spotify";
            break;

        default:
            console.log("WTF is " + request.status + " , bruh ???");
    }
});



// USAGE:   initialize Spotify user login on button-click in pop-up
function initializeLogin(){

    if(!hasSignedIn){
        chrome.runtime.sendMessage({action: 'launchOAuth'});
        //hasSignedIn = true;       UNCOMMENT ME LATER
    }else{
        //hasSignedIn = false;      UNCOMMENT ME LATER
    }

}

// NOTE: adjust me later to accomodate persistent / refreshable user login status
var hasSignedIn = false;

let authButton = document.getElementById('userAuth');
authButton.addEventListener('click', initializeLogin);

let notificationT = document.getElementById('notificationText');