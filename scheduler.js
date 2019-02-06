/**
 *  - schedule music-update checks on all followed artists
 *  - create toast notifications upon new releases
 * 
 *  WARNING:    current stored refresh token must be valid before calling any
 *              of the functions below 
 */

'use strict';

// USAGE:
async function checkArtistReleases() {
    console.log("trying to check artist releases x . x");

    let accessTokenPromise = await getAccessToken();

    let artistNames = [];
    let endpoint = "https://api.spotify.com/v1/me/following?type=artist&limit=50";

    // paginated API calls to get complete list of artists
    while (endpoint != null) {
        let artistList = await getArtists(accessTokenPromise.accessToken, endpoint);
        artistNames = artistNames.concat(parseArtistNames(artistList));
        endpoint = artistList.artists.next;
    }

    // TESTING: 
    console.log(artistNames.length);
    console.log(artistNames);

    // TODO:
    //  1. for each artist, get all albums released this year
    //  2. filter for albums that were newly released between current and previous check
    //  3. create appropriate notifications
    //      a) if multiple track album  -> album toast
    //      b) if single track album    -> single toast
    //
    //  4. OPT: at some point we probably want to store when was our last check in local XD XD XD



 
}


// USAGE:      returns access token from storage
function getAccessToken() {
    return new Promise(function (resolve, reject) {
        chrome.storage.local.get("accessToken", function (resp) {
            if (chrome.runtime.lastError) {
                console.log("stored access token is shit ...");
                reject();
            }
            resolve({ accessToken: resp.accessToken.access_token });
        });
    });
}


// USAGE:   gets 'artists' object based on given endpoint and access token
function getArtists(accessToken, endpoint) {
    return new Promise(function (resolve, reject) {
        let xhrArtistList = new XMLHttpRequest();
        xhrArtistList.open('GET', `${endpoint}`);

        xhrArtistList.setRequestHeader('Content-Type', 'application/json');
        xhrArtistList.setRequestHeader('Accept', 'application/json');
        xhrArtistList.setRequestHeader('Authorization', `Bearer ${accessToken}`);

        // TODO:    maybe improve this later ???
        xhrArtistList.onload = function () {
            if (xhrArtistList.status >= 200 && xhrArtistList.status < 300) {
                console.log("got a list of artists!");
                let resp = JSON.parse(xhrArtistList.response);
                console.log(resp);
                resolve(resp);

            } else {
                console.log("something got fucked when fetching artist lists");
                reject();
            }
        };

        xhrArtistList.send();
    });
}


// USAGE:   parses out and returns array of artist names from 'artists' object
function parseArtistNames(artistList){
    let listLength = artistList.artists.items.length;
    let parsedNames = new Array(listLength);

    var i;
    for(i = 0; i < listLength; i++){
        let a = artistList.artists.items[i];
        parsedNames[i] = a.name;
    }

    return(parsedNames);
}


// USAGE:   returns list of track IDs 
function getTracksByArtist(artistName, timeLength){



}