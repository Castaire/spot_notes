
'use strict';

// USAGE:   initial setup
chrome.runtime.onInstalled.addListener(function(){
    console.log("you just started the extension! hurray!");
});

// USAGE:   initiates authorization flow
// RETURNS: authorization code and state (although not supplied in request)
function authorizeSpotify(){
    const clientID = "fluffy";
    const scope = "user-follow-read";
    const redirect =  chrome.runtime.getURL("login.html");

    let authURL = `https://accounts.spotify.com/authorize?` +
        `=${clientID}` +
        `&response_type=code&redirect_uri=${redirect}` +
        `&scope=${scope}`;

    // launch authorization 
    return chrome.identity.launchWebAuthFlow({
        url: authURL,
        interactive: true
    },
    function(responseUrl){              // TODO: 
        console.log(responseUrl);
    });
}

// USAGE:   handles message passing from various content scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    switch(request.action){
        
        case "launchOAuth":
            alert("just got a launchOAuth message!");
            authorizeSpotify();
            break;

        default:
            alert("Request [ " + request.action + " ] failed :(");
    }
});