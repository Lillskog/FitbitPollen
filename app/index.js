// Import the messaging module
import { PLANT_TYPES } from "../common/globals.js";

import document from "document";
import * as messaging from "messaging";
import { gettext } from "i18n";

// Request pollen data from the companion
function fetchPollen() {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send a command to the companion
    messaging.peerSocket.send({
      command: 'pollen'
    });
  }
}

// Display the pollen data received from the companion
function processPollenData(data) {
  document.getElementById("header-text").text = gettext("title");
  if (typeof data[0] == "string") {
    for(var item in data) {
      document.getElementById("item" + item + "-text").x=0;
      document.getElementById("item" + item + "-text").text = `${gettext(data[item])}`;
    }
  }
  else {
    for(var item in data) {
      document.getElementById("item" + item + "-text").text = `${gettext(data[item]["key"])}: ${gettext(data[item]["value"])}`;
      document.getElementById("item" + item + "-icon").href = `${PLANT_TYPES[data[item]["key"]]}` + ".png"
    }

    //IF MISSING DATA OR FILTERED? HIDE TILE OBJECTS
    if (data.length < 5) {
      for (var i = data.length; i <= 4; i++) {
        document.getElementById("item" + i + "-text").text = "";
        document.getElementById("item" + i + "-icon").href = "";
      }
      if (data.length === 0) {
        document.getElementById("item0-text").x=0;
        document.getElementById("item0-text").text = `${gettext("nodata")}`;
      }
    }
  }
}

// Listen for the onopen event
messaging.peerSocket.onopen = function() {
  // Fetch pollen levels when the connection opens
  fetchPollen();
}

// Listen for messages from the companion
messaging.peerSocket.onmessage = function(evt) {
  if (evt.data) {
    processPollenData(evt.data);
  }
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
}

// Fetch the pollen levels every 24 hours
setInterval(fetchPollen, 24 * 60 * 1000 * 60);
