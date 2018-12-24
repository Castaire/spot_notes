
'use strict';

<<<<<<< HEAD
const clientID = "fluffy";
const clientSecret = "fluffy";
=======
const clientID = "6ac1116fc2574cdc8523cd84d29074c1";
const clientSecret = "1e462635e0f344acb5b274e35b0b22ea";
>>>>>>> 9914082b07ce835027fde4e99bb6d3cf2c92e2a2


// USAGE:   reset storage (just in case), upon installation setup
chrome.runtime.onInstalled.addListener(function(){
    console.log("you just installed the extension! hurray!");
    //chrome.storage.local.clear();
});


// USAGE:  loads popup.js into the current tab
function preloadPopupScript(){
    return new Promise(function(resolve, reject){
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.executeScript(tabs[0].id, {file: "popup.js"}, function(){
                if(chrome.runtime.lastError){
                    console.log("could not preload popup");
                    reject(Error("could not preload popup.js :("));
                }else{
                    console.log("preloaded popup");
                    resolve();
                }
            });
        });
    });
}


// USAGE: 
chrome.runtime.onStartup.addListener(function(){
    
    let preloadScript = preloadPopupScript();
    preloadScript.then(function(){
        
        console.log("got back to startup procedure");

        let lastXHRresponse = chrome.storage.local.get("xhrResponse", function(d){
            if(chrome.runtime.lastError){
                console.log("could not find past authentication data!");
                return;
            }

            // TESTING: 
            console.log("found storage items");
            console.log(d);

            chrome.runtime.sendMessage({status: "hasPreviouslyLoggedIn"});
            checkAccessToken();
            chrome.runtime.sendMessage({status: "checkArtistReleases"});
        });
    });
});





// USAGE:   initiates Spotify authorization flow
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
        // WARNING: for some reason, we get an undefined responseURL upon failed 
        //          user login, instead of an error responseUrl, whut ...
        if(typeof responseUrl == "undefined"){
            chrome.runtime.sendMessage({status: "unsuccessfulLogin"});
            alert("user login was unsuccessful :(");
            return;
        }

        // exchange authorization code with access token
        let authCode = responseUrl.split("=")[1];
        getAccessToken(authCode, redirectURI);
    });
}



// USAGE:   exchanges authorization code for access token in OAuth process 
function getAccessToken(authCode, redirectURI){

    let xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://accounts.spotify.com/api/token');

    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Accept', 'application/json');
    let encodedAuthValue = btoa(clientID + ":" + clientSecret);
    xhr.setRequestHeader('Authorization', `Basic ${encodedAuthValue}`);

    let xhrBody = `grant_type=authorization_code` +
        `&code=${authCode}` +
        `&redirect_uri=${redirectURI}`;

    // runs after completing XHR request
    xhr.onload = function(){
        console.log("finished XHR request !!!");

        if(xhr.status >= 200 && xhr.status < 300){
            let resp = JSON.parse(xhr.response);
            chrome.storage.local.set({"xhrResponse" : resp});

            // updating popup text
            chrome.runtime.sendMessage({status: "successfulLogin"});
            
        }else{
            // TODO: add moar later ???
            console.error("invalid XHR request !!!");
        }
    }

    xhr.send(xhrBody);
}


// USAGE:   check that the current access token is valid; otherwise refresh
// TODO:
function checkAccessToken(){
    // TESTING: 
    console.log("checking access tokens");
}


// USAGE:   handles message passing from various content scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    switch(request.action){

        case "launchOAuth":
            alert("just got a launchOAuth message!");
            authorizeSpotify();
            break;

        case "canCreateAlarm":
            alert("creating alarm now");
            chrome.runtime.sendMessage({status: "createAlarm"});
            break;

        default:
            alert("Request [ " + request.action + " ] failed :(");
    }
});


// USAGE:   handles spot_notes alarm to check for new releases
chrome.alarms.onAlarm.addListener(function(alarm){
    if(alarm.name == "spot_notes_alarm"){
        alert("spot_notes alarm just rang !!!");
        checkAccessToken();
        chrome.runtime.sendMessage({status: "checkArtistReleases"});
    }
});

