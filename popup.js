
/**
 *  - handles pop-up interactions 
 */

'use strict';

var hasSignedIn = false;

// USAGE:   update popup display according to received user-login status
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    switch(request.status){

        case "hasPreviouslyLoggedIn":
        case "successfulLogin":
            chrome.browserAction.setPopup({popup: "login_signedin.html"});
            window.location.href = "login_signedin.html";       // refresh popup
            hasSignedIn = true;
            chrome.runtime.sendMessage({action: "canCreateAlarm"});
            break;

        case "unsuccessfulLogin":
            chrome.browserAction.setPopup({popup: "login_signedin_error.html"});
            window.location.href="login_signedin_error.html";   // refresh popup
            hasSignedIn = false;
            break;
s
        default:
            console.log("WTF is " + request.status + " , bruh ???");
    }
});


///////////////////////////////////////////////////////////////////////////////

let notificationText = document.getElementById('notificationText');

let authButton = document.getElementById('userAuth');
authButton.addEventListener('click', function(){
    if(!hasSignedIn){
        chrome.runtime.sendMessage({action: 'launchOAuth'});

    }else{
        // TODO: disconnect from Spotify, somehow

    }
});
