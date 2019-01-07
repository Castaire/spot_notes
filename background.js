
'use strict';

const clientID = "fluffy";
const clientSecret = "fluffy";


// USAGE:   reset storage and clear alarms upon installation setup
chrome.runtime.onInstalled.addListener(function () {
    console.log("you just installed the extension! hurray!");
    chrome.storage.local.clear();
    chrome.alarms.clear("spot_notes");
});



// USAGE:   
chrome.runtime.onStartup.addListener(function () {
    console.log("you just started up the app!");
    
    // clear past alarm
    chrome.alarms.clear("spot_notes");

    // check current login status
    chrome.storage.local.get("loginStatus", function (value) {
        if (chrome.runtime.lastError || value != "signedin") {
            return;
        }
    });

    // try to get past authentication details
    chrome.storage.local.get("refreshToken", function (refreshToken) {

        if (chrome.runtime.lastError
            || typeof refreshToken["refreshToken"] == "undefined") {
            console.log("could not find past authentication data!");
            return;
        }

        // TESTING: 
        console.log("found refresh token!");
        console.log(refreshToken);

        updateLoginStatusAndPopup("signedin");

        // create alarm and  run artist-update check
        checkAccessToken(refreshToken);
        createAlarm();                      // alarm will ring once upon initiation !!!
    });
});



// USAGE:   initiates Spotify authorization flow
function authorizeSpotify() {
    const scope = "user-follow-read";
    const redirectURI = chrome.identity.getRedirectURL("spotnotes/");

    let authURL = `https://accounts.spotify.com/authorize?` +
        `client_id=${clientID}` +
        `&response_type=code&redirect_uri=${redirectURI}` +
        `&scope=${scope}`;

    // initialize authorization 
    return chrome.identity.launchWebAuthFlow(
        {
            url: authURL,
            interactive: true
        },

        // callback upon authorization request launch
        function (responseUrl) {

            if (chrome.runtime.lastError) {
                updateLoginStatusAndPopup("signedin_error");
                console.log("user login was unsuccessful :(");
                return;
            }

            // exchange authorization code with access token
            let authCode = responseUrl.split("=")[1];
            getAccessToken(authCode, redirectURI);
        }
    );
}



// USAGE:   exchanges authorization code for access token in OAuth process 
function getAccessToken(authCode, redirectURI) {

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
    xhr.onload = function () {
        console.log("finished XHR request !!!");

        if (xhr.status >= 200 && xhr.status < 300) {
            chrome.storage.local.set({ "lastXHRRetrievalTime": Date.now() });

            let resp = JSON.parse(xhr.response);

            console.log(resp["access_token"]);
            chrome.storage.local.set({ "accessToken": resp["access_token"] });
            chrome.storage.local.set({ "refreshToken": resp["refresh_token"] });

            updateLoginStatusAndPopup("signedin");

        } else {
            console.error("invalid XHR request !!!");

        }
    };

    xhr.send(xhrBody);
}



// USAGE:   handles message passing from various content scripts
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "launchOAuth") {
        console.log("just got a launchOAuth message!");

        authorizeSpotify();

        chrome.storage.local.get("loginStatus", function (value) {
            if (value == "signedIn") {
                createAlarm();  // alarm will immediately run ONCE upon initializing
            }
        });

    } else {
        console.log("Request [ " + request.action + " ] failed :(");

    }
});



// USAGE:   handles spot_notes alarm to check for new releases
chrome.alarms.onAlarm.addListener(function () {
    console.log("spot_notes alarm just rang !!!");

    chrome.storage.local.get("refreshToken", function (refreshToken) {

        if (chrome.runtime.lastError) {
            console.error("couldn't find refresh token, gah!!!");
            return;
        }

        checkAccessToken(refreshToken);
        runSpotifyCheck();
    });
});



// USAGE:   updates popup and values, based on login status
function updateLoginStatusAndPopup(status) {
    chrome.storage.local.set({ "loginStatus": status });

    let popupVersion = "login_" + status + ".html";
    chrome.browserAction.setPopup({ popup: `${popupVersion}` });

    // immediately refresh popup if popup is still open
    chrome.runtime.sendMessage({ action: "updatePopup", path: `${popupVersion}` });
}



// USAGE:   runs script to check for latest artist releases
function runSpotifyCheck() {
    // TODO: 
    console.log("trying to run the scheduler!");






}


// USAGE:   creates "spot_notes" alarm
// NOTE:    alarm will ring ONCE upon creation, then will ring once per 15 minute cycle
function createAlarm() {
    alert("trying to create alarm !!!");
    chrome.alarms.get("spot_notes", function (alarm) {

        // TESTING: 
        console.log("alarm! : ");
        console.log(alarm);

        if (typeof alarm != "undefined") {    // alarm has already been created
            return;
        } else {
            console.log("creating alarm!");
            chrome.alarms.create("spot_notes", { when: Date.now(), periodInMinutes: 15 });
        }
    });
}


// USAGE:   
function checkAccessToken(refreshToken) {
    chrome.storage.local.get("lastXHRRetrievalTime", function (time) {

        if (chrome.runtime.lastError || typeof time == "undefined") {
            console.log("Heck. Couldn't find time of last successful XHR retrieval");
        }

        // check if access token is still valid 
        var timeDiff = Date.now() - time;
        if (!isNaN(timeDiff) && timeDiff <= 3540000) {    // 59 minutes in milliseconds
            return;
        }

        // refresh access token 
        let xhrRefresh = new XMLHttpRequest();
        xhrRefresh.open('POST', 'https://accounts.spotify.com/api/token');

        xhrRefresh.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhrRefresh.setRequestHeader('Accept', 'application/json');
        let encodedAuthValue = btoa(clientID + ":" + clientSecret);
        xhrRefresh.setRequestHeader('Authorization', `Basic ${encodedAuthValue}`);

        // TESTING:
        console.log("Hello world motherfuckers !!!");
        console.log(refreshToken);
        console.log(refreshToken["refreshToken"]);

        let xhrRefreshBody = `grant_type=refresh_token` +
            `&refresh_token=${refreshToken["refreshToken"]}`;

        xhrRefresh.onload = function () {
            if (xhrRefresh.status >= 200 && xhrRefresh.status < 300) {
                console.log("sucessfully refreshed access token!");

                let resp = JSON.parse(xhrRefresh.response);
                chrome.storage.local.set({ "accessToken": resp });

            } else {
                console.error("invalid XHR refresh request !!!");
            }
        };

        xhrRefresh.send(xhrRefreshBody);
    });
}



