'use strict';

// USAGE:   initialize Spotify user login on button-click in pop-up
function initializeLogin(){
    chrome.runtime.sendMessage({action: 'launchOAuth'});
}

let authButton = document.getElementById('userAuth');
authButton.addEventListener('click', initializeLogin);