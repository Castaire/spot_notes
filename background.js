
'use strict';

const clientID = "fluffy";
const clientSecret = "fluffy";



// USAGE:   reset storage (just in case), upon installation setup
chrome.runtime.onInstalled.addListener(function(){
    console.log("you just installed the extension! hurray!");
    chrome.storage.local.clear();
});



// USAGE:   
chrome.runtime.onStartup.addListener(function(){
    console.log("you just started up the app!");

    chrome.storage.local.get("loginStatus", function(value){
        if(chrome.runtime.lastError || value != "signedin"){
            return; // exit callback
        }
    });

    // try to get past authentication details
    chrome.storage.local.get("xhrResponse", function(value){

        if(chrome.runtime.lastError){
            console.log("could not find past authentication data!");
            return;
        }

        // TESTING: 
        console.log("found storage items!");
        console.log(value);

        updateLoginStatusAndPopup("signedin");
        checkAccessToken(value);
        // TODO: load 'scheduler.js' then send message to start the check



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
            updateLoginStatusAndPopup("signedin_error");
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
            updateLoginStatusAndPopup("signedin");

        }else{
            console.error("invalid XHR request !!!"); // TODO: add moar later?

        }
    }

    xhr.send(xhrBody);
}



// USAGE:   handles message passing from various content scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    if(request.action == "launchOAuth"){
        alert("just got a launchOAuth message!");
        authorizeSpotify();
        break;

    }else{
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



// USAGE:   updates popup and values, based on login status
function updateLoginStatusAndPopup(status){
    chrome.storage.local.set({"loginStatus" : status});
    
    let popupVersion = "login_" + status + ".html";
    chrome.browserAction.setPopup({popup : `${popupVersion}`});
    window.location.href = popupVersion; // update popup version immediately
}



// USAGE:   loads and runs script to check for artist releases
function loadRunScheduler(){
    // TODO: 
    print("trying to load and run the scheduler!");
}



// USAGE:   check that the current access token is valid; otherwise refresh
// TODO:
function checkAccessToken(obj){
    // TESTING: 
    console.log("checking access tokens");
}
