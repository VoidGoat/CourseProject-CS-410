// variable to keep track of current search method
searchMethod = "fuzzy";

// Set the initial method
setSearchMethod("fuzzy");

function listenForClicks() {
  document.addEventListener("click", (e) => {

    /**
     * Sends search bar text and search method to find.js
     */
    function sendFindRequest(tabs) {
        console.log("search type: " + searchMethod);
        clearResults();
        browser.tabs.sendMessage(tabs[0].id, {
          command: "find",
          method: searchMethod,
          findQuery: document.getElementById("search-bar").value
        }).then(() => {
          console.log("query complete");
        });
    }

    /**
     * Remove the page-hiding CSS from the active tab,
     * send a "reset" message to the content script in the active tab.
     */
    function reset(tabs) {
      clearResults();
      browser.tabs.sendMessage(tabs[0].id, {
        command: "reset",
      });
    }

    /**
     * Just log the error to the console.
     */
    function reportError(error) {
      console.error(`Could not search: ${error}`);
    }

    /**
     * Get the active tab,
     * then call the approriate function
     */
    if (e.target.id === "search-button") {
      browser.tabs.query({active: true, currentWindow: true})
        .then(sendFindRequest)
        .catch(reportError);
    }
    // Clear results if clear button pressed
    else if (e.target.id === "clear-button") {
      browser.tabs.query({active: true, currentWindow: true})
        .then(reset)
        .catch(reportError);
    }

    else if (e.target.classList.contains("focus-button")) {
      // console.log("FOCUS BUTTON!" + e.target.value);
      browser.tabs.query({active: true, currentWindow: true})
        .then((tabs) => focusOnResult(tabs, e.target.value))
        .catch(reportError);
    }
    else if (e.target.id === "fuzzy-button") {
      console.log("Switching to Fuzzy search!");
      setSearchMethod("fuzzy");

    }
    else if (e.target.id === "relational-button") {
      console.log("Switching to Relational search!");
      setSearchMethod("relational");
    }

  });

  /**
   * Receive messages from content_script
   * Receive results and generate buttons accordingly
   */
  browser.runtime.onMessage.addListener((message) => {
    if (message.command === "receive-results") {
      console.log(message);

      const resultsEl = document.getElementById("results");

      // Display info if message contains it
      if (message.info !== "") {
        const infoEl = document.createElement('p');
        infoEl.classList.add("message-info");
        infoEl.innerText = message.info;

        resultsEl.append(infoEl);

      }

      // Add all results to section
      message.results.forEach(element => {
        const resultEntry = document.createElement("button");
        resultEntry.classList.add("result-button");
        // resultEntry.onclick = "focusOnResult(" + element.resultID + ")";
        resultEntry.value = element.resultID;
        resultEntry.classList.add("focus-button");

        resultEntry.innerText = element.resultID + ": " + element.text;

        const scoreEl = document.createElement('span');
        scoreEl.append(document.createTextNode("score = " + element.score.toFixed(2)));
        scoreEl.style.color = scoreToColor(element.score);
        scoreEl.style.float = "right";
        resultEntry.appendChild(scoreEl);
        
        resultsEl.appendChild(resultEntry);
      });
    }
  });
}

/**
 * Converts a float from 0.0-1.0 to an rgb color
 */
function scoreToColor(score) {
  // scale colors darker a bit
  score *= 0.8;

  // Calculate red and green components
  const green = (score * 255).toFixed();
  const red = ((1.0 - score) * 255).toFixed();

  return "rgb(" + red + ", " + green + ", 0)";
}


/**
 * Switches between fuzzy and relational search
 */
function setSearchMethod(newMethod) {
  if (newMethod === "fuzzy") {
    searchMethod = "fuzzy";
    document.getElementById("fuzzy-button").classList.add("selected-button");
    document.getElementById("relational-button").classList.remove("selected-button");
  } else if (newMethod === "relational") {
    searchMethod = "relational";
    document.getElementById("fuzzy-button").classList.remove("selected-button");
    document.getElementById("relational-button").classList.add("selected-button");

  }
}


// Clears all data from the results div
function clearResults() {
      // Remove all child buttons from results
      const resultsDiv = document.getElementById("results");
      while (resultsDiv.children.length > 0) {
        resultsDiv.removeChild(resultsDiv.firstChild);
      }

}

function focusOnResult(tabs, resultID) {
  browser.tabs.sendMessage(tabs[0].id, {
    command: "focus-on-result",
    resultID: resultID
  });
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(`Failed to execute content script: ${error.message}`);
}


/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */

listenForClicks();