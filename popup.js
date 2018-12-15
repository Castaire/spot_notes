
/**
 *  - handles pop-up interactions 
 */

'use strict';

var hasSignedIn = false;

// USAGE:   modifies popup text according to received user-login status
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    switch(request.status){

        case "successfulLogin":
            notificationText.innerHTML = "WHOO! Successfully logged-in with Spotify!";
            authButton.innerHTML = "Disconnect from Spotify";
            hasSignedIn = true;
            
            chrome.runtime.sendMessage({status: "canCreateAlarm"});
            break;

        case "unsuccessfulLogin":
            notificationText.innerHTML = "Hmmm, something happened. Wanna try again?";
            authButton.innerHTML = "Reconnect with Spotify";
            hasSignedIn = false;
            break;

        default:
            console.log("WTF is " + request.status + " , bruh ???");
    }
});


// USAGE:   initialize Spotify user login on button-click in pop-up
function initializeLogin(){

    // TODO: 
    if(!hasSignedIn){
        chrome.runtime.sendMessage({action: 'launchOAuth'});
        
    }else{
        
    }

}

let authButton = document.getElementById('userAuth');
authButton.addEventListener('click', initializeLogin);

let notificationText = document.getElementById('notificationText');