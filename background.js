
'use strict';

const clientID = "6ac1116fc2574cdc8523cd84d29074c1";
const clientSecret = "5f103edb1dab40c19bb326fc2dc590ce";

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
    chrome.storage.local.get("loginStatus", function (statusObj) {
        if (chrome.runtime.lastError || statusObj.loginStatus != "signedin") {
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

        updateLoginStatusAndPopup("signedin");

        // create alarm and run artist-update check
        checkAccessToken(refreshToken)
            .then(createAlarm(60))             // alarm will ring once upon initiation !!! 
            .catch(function (err) {
                console.error(err);
            });
    });
});



// USAGE:   initiates Spotify authorization flow
function authorizeSpotify() {
    return new Promise(function (resolve, reject) {

        const scope = "user-follow-read";
        const redirectURI = chrome.identity.getRedirectURL("spotnotes/");

        let authURL = `https://accounts.spotify.com/authorize?` +
            `client_id=${clientID}` +
            `&response_type=code&redirect_uri=${redirectURI}` +
            `&scope=${scope}`;

        // initialize authorization 
        chrome.identity.launchWebAuthFlow(
            {
                url: authURL,
                interactive: true
            },

            // callback upon authorization request launch
            function (responseUrl) {
                if (chrome.runtime.lastError) {
                    updateLoginStatusAndPopup("signedin_error");
                    reject("user login was unsuccessful :(");

                } else {
                    console.log("user login was successful!");
                    let authCode = responseUrl.split("=")[1];
                    resolve({ authCode: authCode, redirectURI: redirectURI });

                }
            }
        );

    });

}



// USAGE:   exchanges authorization code for access token in OAuth process 
function accessTokenExchange(authCode, redirectURI) {
    return new Promise(function (resolve, reject) {

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

                chrome.storage.local.set({ "accessToken": resp["access_token"] });
                chrome.storage.local.set({ "refreshToken": resp["refresh_token"] });

                updateLoginStatusAndPopup("signedin");
                resolve();

            } else {
                reject("invalid XHR request !!!");
            }
        };

        xhr.send(xhrBody);
    })
}



// USAGE:   updates popup and values, based on login status
function updateLoginStatusAndPopup(status) {
    chrome.storage.local.set({ "loginStatus": status });

    let popupVersion = "login_" + status + ".html";
    chrome.browserAction.setPopup({ popup: `${popupVersion}` });

    // immediately refresh popup if popup is open
    chrome.runtime.sendMessage({ action: "updatePopup", path: `${popupVersion}` });
}



// USAGE:   creates "spot_notes" alarm
// NOTE:    alarm will ring ONCE upon creation, then will ring once per cycleTime (in minutes)
//          - default cycle time is 60 minutes
function createAlarm(cycleTime) {
    if (cycleTime == undefined) { cycleTime = 60; }

    chrome.alarms.get("spot_notes", function (alarm) {

        if (typeof alarm != "undefined") {      // alarm has already been created
            return;
        } else {
            console.log("creating alarm!");
            chrome.alarms.create("spot_notes", { when: Date.now(), periodInMinutes: cycleTime });
        }
    });
}


// USAGE:   checks access token validity; refresh if there are less than 1 minute remaining
// NOTE:    a spotify access token is valid for 60 minutes
function checkAccessToken(refreshToken) {
    return new Promise(function (resolve, reject) {
        chrome.storage.local.get("lastXHRRetrievalTime", function (time) {

            if (chrome.runtime.lastError || typeof time == "undefined") {
                console.log("Heck. Couldn't find time of last successful XHR retrieval");
            }

            // check if access token is still valid
            var timeElapsed = Date.now() - time;
            if (!isNaN(timeElapsed) && timeElapsed <= 3540000) {    // 59 minutes in milliseconds
                return;
            }

            // refresh access token 
            let xhrRefresh = new XMLHttpRequest();
            xhrRefresh.open('POST', 'https://accounts.spotify.com/api/token');

            xhrRefresh.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhrRefresh.setRequestHeader('Accept', 'application/json');
            let encodedAuthValue = btoa(clientID + ":" + clientSecret);
            xhrRefresh.setRequestHeader('Authorization', `Basic ${encodedAuthValue}`);

            let xhrRefreshBody = `grant_type=refresh_token` +
                `&refresh_token=${refreshToken["refreshToken"]}`;

            xhrRefresh.onload = function () {
                if (xhrRefresh.status >= 200 && xhrRefresh.status < 300) {
                    console.log("sucessfully refreshed access token!");

                    let resp = JSON.parse(xhrRefresh.response);
                    chrome.storage.local.set({ "accessToken": resp });
                    resolve();

                } else {
                    reject("invalid XHR refresh request");
                }
            };

            xhrRefresh.send(xhrRefreshBody);
        });
    })
}



// USAGE:   removes all existing 
function logoutUser() {
    chrome.storage.local.clear();
    chrome.alarms.clear("spot_notes");

    chrome.identity.launchWebAuthFlow(
        {
            url: 'https://accounts.spotify.com/en/logout',
            interactive: true
        }, 

        function (responseUrl){
            if(chrome.runtime.lastError){
                console.log("user exited out of login/logout screen");
            }
            console.log("finished logging out!")
        }
    )

    updateLoginStatusAndPopup("default");
}


// USAGE:    handles message passing from various content scripts
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "launchOAuth") {
        console.log("just got a launchOAuth message!");

        authorizeSpotify().then(function (authResult) {
            // exchange auth code for access token
            return (accessTokenExchange(authResult["authCode"], authResult["redirectURI"]));

        }).then(function () {
            console.log("creating alarm after signing in! ");
            createAlarm(60);                      // will ring once upon initializing

        }).catch(function (error) {
            console.log("something got fucked :(");
            console.log(error);
        });

    } else if (request.action == "logoutUser") {
        console.log("trying to log user out!");
        logoutUser();

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

        checkAccessToken(refreshToken).then(function () {
            checkArtistReleases();

        }).catch(function (err) {
            console.error(err);
        });
    });
});

