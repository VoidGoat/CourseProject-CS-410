function listenForClicks() {
  document.addEventListener("click", (e) => {

    console.log("CLICKED!");
    console.log("e.target.id" + e.target.id);
    console.log(document.getElementById("search-bar"));
    console.log("search bar text:" + document.getElementById("search-bar").value)

    /**
     */
    function sendFindRequest(tabs) {

        clearResults();
        browser.tabs.sendMessage(tabs[0].id, {
          command: "find",
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
     * then call "sendFindRequest()" or "reset()" as appropriate.
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
      console.log("FOCUS BUTTON!" + e.target.value);
      browser.tabs.query({active: true, currentWindow: true})
        .then((tabs) => focusOnResult(tabs, e.target.value))
        .catch(reportError);
    }

  });

  browser.runtime.onMessage.addListener((message) => {
    console.log("NEW MESSAGE!")

    if (message.command === "receive-results") {
      console.log(message.results);
      const resultsEl = document.getElementById("results");

      // Add all results to section
      message.results.forEach(element => {
        const resultEntry = document.createElement("button");
        // resultEntry.onclick = "focusOnResult(" + element.resultID + ")";
        resultEntry.value = element.resultID;
        resultEntry.classList.add("focus-button");
        resultEntry.innerText = element.resultID + " score = " + element.score.toFixed(2) + ": " + element.text;
        resultsEl.appendChild(resultEntry);
      });
    }
  });
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
// browser.tabs.executeScript({file: "content_scripts/fuzzyset.js"})
// // .then( () => {browser.tabs.executeScript({file: "content_scripts/wordnet-js/lib/wordnet-file.js"})
// // .then( () => {browser.tabs.executeScript({file: "content_scripts/wordnet-js/lib/data-file.js"}) 
// // .then( () => {browser.tabs.executeScript({file: "content_scripts/wordnet-js/lib/index-file.js"}) 
// // .then( () => {browser.tabs.executeScript({file: "content_scripts/wordnet-js/lib/wordnet.js"}) 
// .then( () => { browser.tabs.executeScript({file: "content_scripts/find.js"})
// .then(listenForClicks)
// .catch(reportExecuteScriptError);}).catch(reportExecuteScriptError);
// })
// })
// })
// });
        // "content_scripts/fuzzyset.js",
        // "content_scripts/wordnet-js/lib/wordnet-file.js",
        // "content_scripts/wordnet-js/lib/data-file.js",
        // "content_scripts/wordnet-js/lib/index-file.js",
        // "content_scripts/wordnet-js/lib/wordnet.js",
        // "content_scripts/find.js"})

  // "background": {
  //   "scripts": [
  //     "content_scripts/require.js"
  //   ]
  // }

