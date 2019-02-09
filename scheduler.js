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

    /* TESTING:     UNCOMMENT LATER; FOR TESTING PURPOSES ONLY
    let artistNames = [];
    let endpoint = "https://api.spotify.com/v1/me/following?type=artist&limit=50";

    // paginated API calls to get complete list of artists
    while (endpoint != null) {
        let artistList = await getArtists(accessTokenPromise.accessToken, endpoint);
        artistNames = artistNames.concat(parseArtistNames(artistList));
        endpoint = artistList.artists.next;
    }

    console.log(artistNames.length);
    console.log(artistNames);
    */

    // TODO:
    //  1. for each artist, get all albums released this year
    //  2. filter for albums that were newly released between current and previous check
    //  3. create appropriate notifications
    //      a) if multiple track album  -> album toast
    //      b) if single track album    -> single toast
    //
    //  4. OPT: at some point we probably want to store when was our last check in local XD XD XD

    // TESTING: 
    let accessTokenPromise = await getAccessToken();
    let accessToken = accessTokenPromise.accessToken;

    let t = await getAlbumsByArtistName("khai dreams", 2018, accessToken);
    console.log(t);

    let parsedAlbums = parseAlbums(t, new Date("2018-05-05"));
    console.log(parsedAlbums);

    createNotifications("khai dreams", parsedAlbums);
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
                resolve(resp);

            } else {
                console.log("something got fucked when fetching artist lists");
                reject();
            }
        };

        xhrArtistList.send();
    });
}


// USAGE:   returns list of albums for given artist name 
// TODO:    hmmm, maybe there's a way to abstract this 
//                  ^ pretty similar to what 'getArtists' is doing .....
function getAlbumsByArtistName(artistName, year, accessToken) {
    return new Promise(function (resolve, reject) {
        let xhrAlbums = new XMLHttpRequest();

        let endpoint = `https://api.spotify.com/v1/search?`;
        endpoint = `${endpoint}q="${artistName}"%20year:${year}&type=album&limit=50`;

        xhrAlbums.open('GET', `${endpoint}`);

        xhrAlbums.setRequestHeader('Content-Type', 'application/json');
        xhrAlbums.setRequestHeader('Accept', 'application/json');
        xhrAlbums.setRequestHeader('Authorization', `Bearer ${accessToken}`);

        xhrAlbums.onload = function () {
            if (xhrAlbums.status >= 200 && xhrAlbums.status < 300) {
                console.log("got the artist's album!");
                let resp = JSON.parse(xhrAlbums.response);
                resolve(resp);

            } else {
                console.log("something went funk getting an artist's album");
                reject();
            }
        }

        xhrAlbums.send();
    });
}



// USAGE:   parses out and returns array of artist names from 'artists' object
function parseArtistNames(artistList) {
    let listLength = artistList.artists.items.length;
    let parsedNames = new Array(listLength);

    var i;
    for (i = 0; i < listLength; i++) {
        let artist = artistList.artists.items[i];
        parsedNames[i] = artist.name;
    }

    return (parsedNames);
}


// USAGE:   
// WARNING:     'date' must be a Date object !!!
function parseAlbums(albumList, date) {
    let results = [];

    var i;
    for (i = 0; i < albumList.albums.total; i++) {
        let album = albumList.albums.items[i];

        // TODO:    can we actually ignore albums with non-day-precision ???
        // WARNING: not sure, think about this later XD XD XD
        if (album.release_date_precision == "day") {

            if (new Date(album.release_date) > date) {

                // get URL of smallest album image
                let albumImage = album.images[album.images.length - 1];
                let albumObj = {
                    name: `${album.name}`, date: `${album.release_date}`,
                    type: `${album.album_type}`, image_url: `${albumImage.url}`
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
 */
function createNotifications(artistName, parsedAlbums) {
    let listSize = parsedAlbums.length;
    



}