
'use strict';

// USAGE:   initial setup
chrome.runtime.onInstalled.addListener(function(){
    console.log("you just started the extension! hurray!");
});

// USAGE:   exchanges authorization code for access token in OAuth process 
function makeXHRExchange(authCode){
    // TODO: 
    



    return("fluffy");
}


// USAGE:   initiates authorization flow
// RETURNS: authorization code and state (although not supplied in request)
function authorizeSpotify(){
    const scope = "user-follow-read";
    const clientID = "fluffy";
    const redirectURI = chrome.identity.getRedirectURL("spotnotes/");

    let authURL = `https://accounts.spotify.com/authorize?` +
        `client_id=${clientID}` +
        `&response_type=code&redirect_uri=${redirectURI}` +
        `&scope=${scope}`;

    console.log(authURL);

    // launch authorization 
    return chrome.identity.launchWebAuthFlow({
        url: authURL,
        interactive: true
    },

    function(responseUrl){
        console.log("just got the responseUrl back!");
        console.log(responseUrl);

        // handle failed user login
        if(responseUrl.includes("error")){
            chrome.runtime.sendMessage({status: "unsuccessfulLogin"});
            alert("user login was unsuccessful");
        }

        // exchange authorization code with access token
        authCode = responseUrl.split("=")[1];
        console.log(authCode);

        accessToken = makeXHRExchange(authCode);
        // TODO: 

        

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