
/**
 *  - handles pop-up interactions 
 */

'use strict';

// USAGE:   immediately refresh popup html version
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    if(request.action == "updatePopup"){
        window.location.href = `${request.path}`;
        alert(`${request.path}`);
    }
});

///////////////////////////////////////////////////////////////////////////////

let notificationText = document.getElementById('notificationText');

let authButton = document.getElementById('userAuth');
authButton.addEventListener('click', function(){
    
    chrome.storage.local.get("loginStatus", function(value){

        if(chrome.runtime.lastError || value != "signedin"){
            chrome.runtime.sendMessage({action: 'launchOAuth'});
        };

        // TODO: maybe do something so the user can log out? O.O

    });
});