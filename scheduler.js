/**
 *  - schedule music-update checks on all followed artists
 *  - create toast notifications upon new releases
 */

'use strict';

var spotifyAlarm;

chrome.runtime.onMessage.addListener(function(request, sender, response){
    switch(request.status){

        case "createAlarm":
            console.log("creating spotify alarm now !!!");
            spotifyAlarm = chrome.alarms.create("spot_notes_alarm", 
                {periodInMinutes: 2});
            break;

        case "checkArtistReleases":
            checkArtistReleases();
            break;

        default:
            console.log("WTF IS THIS MESSAGE : " + request.status);
    }
});


// USAGE: check all followed artists for new music releases
// TODO: 
function checkArtistReleases(){

}


// USAGE: create toast notification
// TODO: 
function createToast(){

}