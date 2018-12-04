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
    chrome.runtime.sendMessage({action: 'launchOAuth'});
}

let authButton = document.getElementById('userAuth');
authButton.addEventListener('click', initializeLogin);

let notificationT = document.getElementById('notificationText');