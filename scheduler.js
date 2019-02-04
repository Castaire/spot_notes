/**
 *  - schedule music-update checks on all followed artists
 *  - create toast notifications upon new releases
 * 
 *  WARNING:    current stored refresh token must be valid before calling any
 *              of the functions below 
 */

'use strict';

// USAGE:      returns list of all artists followed by the user
function checkArtistReleases() {
    console.log("trying to check artist releases =w=");
    let artistNames = [];

    // NOTE:  (idea) -> let's just perform the process on each batch of data, until
    //                  we run out ... maybe?


    getAccessToken().then(function(accessToken){
        let endpoint = "https://api.spotify.com/v1/me/following?type=artist&limit=50";
        console.log(accessToken);


    });
}

// USAGE:      returns access token from storage
function getAccessToken() {
    return new Promise(function (resolve, reject) {
        chrome.storage.local.get("accessToken", function (resp) {
            if (chrome.runtime.lastError) {
                console.log("stored access token is shit ...");
                reject();
            }
            resolve({accessToken: resp.accessToken.access_token});
        });
    });
}

// USAGE:  gets 'artists' object based on given endpoint
function getArtists(accessToken, endpoint) {




}