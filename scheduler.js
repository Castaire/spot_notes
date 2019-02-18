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
    console.log("checking for new releases from followed artists ...");

    removeOldAlbumURLs();

    let accessTokenPromise = await getAccessToken();
    let accessToken = accessTokenPromise.accessToken;

    // date handling
    var today = new Date();                     // today's date in full format
    var currentYear = today.getFullYear();      // YYYY
    var today_date = new Date(currentYear, today.getMonth(), today.getDate());  // YYYY-MM-DD

    // get complete list of names of followed artists
    let artists_endpoint = "https://api.spotify.com/v1/me/following?type=artist&limit=50";
    let artistNames = await makePaginatedCalls(artists_endpoint, accessToken, parseArtistNames);

    let search_endpoint = `https://api.spotify.com/v1/search?`;

    var i;
    for (i = 0; i < artistNames.length; i++) {
        console.log(`parsing artist : ${i}`);

        let name = artistNames[i];

        // get complete list of albums by the artist for the current year
        let album_endpoint = `${search_endpoint}q="${name}"%20year:${currentYear}&type=album&limit=50`;
        let parsed_albums = await makePaginatedCalls(album_endpoint, accessToken, parseAlbums, today_date);

        if (parsed_albums.length > 0) {
            createNotifications(name, parsed_albums);
        }
    }

    console.log("completed check!");
}



// USAGE:   remove all locally-stored album URL values from last checkArtistRelease process
function removeOldAlbumURLs(){
    chrome.storage.local.get("lastNotificationID", function(value){

        if(chrome.runtime.lastError || typeof value == "undefined"){
            console.log("no previously defined value for lastNotificationID!");
            return;
        }

        var i;
        for(i = 0; i < value; i++){
            chrome.storage.local.remove(i.toString());
        }
       
        console.log("removed all old album URLs...");
    });
}



/**
 * USAGE:   generalized function to make paginated GET requests based
 *          on provided endpoint and valid access token
 * 
 * @param {string}      endpoint        
 * @param {string}      accessToken     
 * @param {function}    parser          - relevant parser function for list object returned by GET
 * @param {Date}        today_date      - REQUIRED if your parser requires a Date parameter
 */

async function makePaginatedCalls(endpoint, accessToken, parser, dateParam){
    let results = [];

    while(endpoint != null){
        let itemList = await getObjects(endpoint, accessToken);

        if(parser.name == "parseArtistNames"){
            results = results.concat(parser(itemList));
            endpoint = itemList.artists.next;

        }else if(parser.name == "parseAlbums"){
            results = results.concat(parser(itemList, dateParam));
            endpoint = itemList.albums.next;

        }
    }

    return results;
}



// USAGE:   returns access token from storage
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



// USAGE:   generalized function to make GET requests based on provided endpoint
//          and valid access token
function getObjects(endpoint, accessToken) {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', `${endpoint}`);

        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                let resp = JSON.parse(xhr.response);
                resolve(resp);

            } else {
                console.log("something went funk when requesting for objects...");
                reject();
            }
        }

        xhr.send();
    });
}



// USAGE:   parses out and returns array of artist names from 'artists' object
function parseArtistNames(artistList) {
    let listLength = artistList.artists.items.length;
    if(listLength == 0){return []};

    let parsedNames = new Array(listLength);
    var i;
    for (i = 0; i < listLength; i++) {
        let artist = artistList.artists.items[i];
        parsedNames[i] = artist.name;
    }

    return (parsedNames);
}



/**
 * USAGE:
 * @param {} albumList
 * @param {Date} date
 * 
 * NOTE:    from some testing, it seems that most album relase dates will have a "day" precision,
 *          however according to the documentation, this isn't necessary the case
 * 
 *          for now, I will ONLY create notifications for albums that have relase dates
 *          with "day" precision > . < ||| 
 */
function parseAlbums(albumList, date) {
    let albumsLength = albumList.albums.items.length;
    if(albumsLength == 0){ return []; }
    
    let results = [];
    var i;
    for (i = 0; i < albumList.albums.items.length; i++) {
        let album = albumList.albums.items[i];

        if (album.release_date_precision == "day") {
            if (new Date(album.release_date) >= date) {

                // get URL of smallest album image
                let albumImage = album.images[album.images.length - 1];

                let albumObj = {
                    name: `${album.name}`, date: `${album.release_date}`,
                    type: `${album.album_type}`, image_url: `${albumImage.url}`,
                    web_url: `${album.external_urls.spotify}`
                };

                results.push(albumObj);
            }
        }
    }

    return (results);
}


// USAGE:   create notifications for new albums (or singles)
/**
 * @param {string}  artistName      - name of the artist
 * @param {Array[]} parsedAlbums    - list of custom 'album' objects, each containing:
 * 
 *          0) name             - name of album
 *          1) date             - date of album release
 *          2) type             - type of album ("album" or "single")
 *          3) image_url        - url to album image
 *          4) web_url          - url to album
 */
function createNotifications(artistName, parsedAlbums) {
    var i;
    for (i = 0; i < parsedAlbums.length; i++) {
        let albumObj = parsedAlbums[i];

        let notification = {
            type: 'basic',
            iconUrl: `${albumObj.image_url}`,
            title: `${albumObj.name} - ${artistName}`,
            message: ''
        }

        if (albumObj.type == "album") {
            notification.message = `new album released on ${albumObj.date}`;
        } else if (albumObj.type == "single") {
            notification.message = `new single released on ${albumObj.date}`
        }

        // hash the album's web URL to local storage by notification id
        chrome.storage.local.set({ [i.toString()]: albumObj.web_url });

        // this value is referenced when we want to remove the stored album URLs
        chrome.storage.local.set({ lastNotificationID: parsedAlbums.length});

        chrome.notifications.create(i.toString(), notification);
    }
}


// USAGE:   upon user click, open album URL in a new tab inside current window
chrome.notifications.onClicked.addListener(function (notificationID) {
    console.log(notificationID);

    chrome.storage.local.get(notificationID, function (albumURL) {
        console.log(albumURL);
        console.log(albumURL[notificationID]);
        chrome.tabs.create({ url: albumURL[notificationID] });
    });

    // remove stored album URL
    chrome.storage.local.remove(notificationID, function () {
        console.log("removing album URL on click");
    });
});