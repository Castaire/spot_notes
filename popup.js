
/**
 *  - handles pop-up interactions 
 */

'use strict';

// USAGE:   immediately refresh popup html version
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    if(request.action == "updatePopup"){
        window.location.href = `${request.path}`;
    }
});

let notificationText = document.getElementById('notificationText');

let authButton = document.getElementById('userAuth');
authButton.addEventListener('click', function(){
    
    chrome.storage.local.get("loginStatus", function(statusObj){

        var status = statusObj.loginStatus;

        if(chrome.runtime.lastError || status != "signedin"){    // launch authorization process
            chrome.runtime.sendMessage({action: 'launchOAuth'});

        }else if(status == "signedin"){                         // logout and remove authorization
            chrome.runtime.sendMessage({action: 'logoutUser'});

        }
    });
});