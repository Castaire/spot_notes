
'use strict';

const clientID = "fluffy";
const clientSecret = "floof";

// USAGE:   initial setup
chrome.runtime.onInstalled.addListener(function(){
    console.log("you just started the extension! hurray!");
});


// USAGE:   exchanges authorization code for access token in OAuth process 
function makeXHRPost(authCode, redirectURI){

    let xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://accounts.spotify.com/api/token');

    // set request header 
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Accept', 'application/json');

    let encodedAuthValue = btoa(clientID + ":" + clientSecret);
    xhr.setRequestHeader('Authorization', `Basic ${encodedAuthValue}`);

    // set request body
    let xhrBody = `grant_type=authorization_code` +
        `&code=${authCode}` +
        `&redirect_uri=${redirectURI}`;

    // post-processing after finishing XHR request
    xhr.onload = function(){
        console.log("finished XHR request !!!");

        if(xhr.status >= 200 && xhr.status < 300){
            let resp = JSON.parse(xhr.response);
            chrome.storage.local.set({"xhrResponse" : resp});

            // updating popup text
            chrome.runtime.sendMessage({status: "successfulLogin"});
        }
    }

    xhr.send(xhrBody);
}


// USAGE:   initiates authorization flow
// RETURNS: authorization code and state (although not supplied in request)
function authorizeSpotify(){
    const scope = "user-follow-read";
    const redirectURI = chrome.identity.getRedirectURL("spotnotes/");

    let authURL = `https://accounts.spotify.com/authorize?` +
        `client_id=${clientID}` +
        `&response_type=code&redirect_uri=${redirectURI}` +
        `&scope=${scope}`;

    // initialize authorization 
    return chrome.identity.launchWebAuthFlow({
        url: authURL,
        interactive: true
    },

    // callback upon authorization request launch
    function(responseUrl){

        // handle failed user login
        // NOTE: for some reason, we get an undefined responseURL upon failed 
        //       user login, instead of an error responseUrl, whut ...
        if(typeof responseUrl == "undefined"){
            chrome.runtime.sendMessage({status: "unsuccessfulLogin"});
            alert("user login was unsuccessful :(");
            return;
        }

        // exchange authorization code with access token
        let authCode = responseUrl.split("=")[1];
        makeXHRPost(authCode, redirectURI);

        // TODO: do something here ???
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


// USAGE:   handles alarms from various content scripts
chrome.alarms.onAlarm.addListener(function(alarm){
    switch(alarm.name){

        case "checkArtists":
            alert("can check artist releases now !!!");
            chrome.runtime.sendMessage({status: "checkArtists"});
            break;

        default:
            alert("WTF IS THIS ALARM " + alarm.name + " BRO, YOU CRAY?");
    }
});