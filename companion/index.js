// Import the messaging module
import * as messaging from "messaging";
import {geolocation} from "geolocation";
import { settingsStorage } from "settings";

var status = true
var statusmsg = []
var LAT = "";  // LATITUDE IN DECIMAL FORM
var LONG = "";  // LATITUDE IN DECIMAL FORM

function locationSuccess(position) {
    console.log("Location successful")
    setCoords(position.coords.latitude, position.coords.longitude);
}

function locationError(error) {
  console.log("Error: " + error.code,
              "Message: " + error.message);
}

function setCoords(lat,long) {
  LAT = lat;
  LONG = long;
}


// Fetch the pollen levels from Breezometer
function queryOpenPollen() {
  // CHECK SETTINGS
  let toggleValue = settingsStorage.getItem("toggle");
  if (toggleValue === "true") {
    geolocation.getCurrentPosition(locationSuccess, locationError, {maximumAge: Infinity,timeout: 6 * 1000});
  }
  else {
    if (settingsStorage.getItem("latitude")==null || JSON.parse(settingsStorage.getItem("latitude")).name==="" ||           settingsStorage.getItem("longitude")==null || JSON.parse(settingsStorage.getItem("longitude")).name===""){
      statusmsg.push("missingcoord")
      status = false
    }
    else {
      LAT = JSON.parse(settingsStorage.getItem("latitude")).name
      LONG = JSON.parse(settingsStorage.getItem("longitude")).name
    }
  }
  
  if (settingsStorage.getItem("apikey")==null || JSON.parse(settingsStorage.getItem("apikey")).name==="") {
    statusmsg.push("missingapi")
    status = false
  }
  else{
    var API_K = JSON.parse(settingsStorage.getItem("apikey")).name
  }
  if (status) {
    var ENDPOINT = "https://api.breezometer.com/pollen/v2/forecast/daily?lat=" + LAT + "&lon=" + LONG + "&days=1" +
               "&key=" + API_K + "&features=plants_information";
    fetch(ENDPOINT)
    .then(function (response) {
        response.json()
        .then(function(data) {
          let err = JSON.parse(JSON.stringify(data["error"]));
          try {
            if (err["code"] === "location_unsupported") {
              statusmsg.push("unsupported")
            }
            else if (err["code"] === "bad_request") {
              statusmsg.push("invalidcoord")
            }
            else if (err["code"] === "invalid_api_key") {
              statusmsg.push("invalidapi")
            }
            returnPollenData(statusmsg);
          }
          catch{
          let obj = JSON.parse(JSON.stringify(data["data"]["0"]["plants"]));
          var indexarray = [];
          //code "invalid_api_key"
          //code "bad_request"

          for (var plant in obj) {
            if (obj[plant]["data_available"] && obj[plant]["in_season"]){
              indexarray.push({"key": plant, "value": obj[plant]["index"]["value"]});
            }
          }

          // SORT: RANK EACH PLANT TYPE ACCORDING TO HIGHEST POLLEN INDEX
          // https://community.fitbit.com/t5/SDK-Development/Does-the-message-api-alter-json-objects/m-p/2598085
          indexarray.sort(function (a, b) { 
            var as = a['value'], bs = b['value']; 
            return as == bs ? 0 : (bs > as ? 1 : -1); 
          });

          // FILTERING: IF ONLY A SUBSET OF ALL PLANTS ARE RELEVANT
          let settingsArray = JSON.parse(settingsStorage.getItem("multiselection"));
          var filterarray = [];

          for (var index in settingsArray.values) {
            filterarray.push(settingsArray.values[index].name.toLowerCase());        
          }

          indexarray = indexarray.filter(function(array) {
            return this.indexOf(array["key"]) > -1;},filterarray);

          // LIMIT: PREVENT THE DISPLAY FROM BEING OVERCROWDED
          if(indexarray.length >= 5){
            indexarray = indexarray.slice(0,5);
          }

          returnPollenData(indexarray);
        }
        finally{}
        });
    })
    .catch(function (err) {
      console.log("Error fetching pollen levels: " + err);
    });
  }
  else {
    returnPollenData(statusmsg);
  }
}

// Send the pollen data to the device
function returnPollenData(data) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send a command to the device
    messaging.peerSocket.send(data);
  } else {
    console.log("Error: Connection is not open");
  }
}

// Listen for messages from the device
messaging.peerSocket.onmessage = function(evt) {
  if (evt.data && evt.data.command == "pollen") {
    // The device requested pollen data
    queryOpenPollen();
  }
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
}
