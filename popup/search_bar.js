function listenForClicks() {
  document.addEventListener("click", (e) => {

    console.log("CLICKED!");
    console.log(e.target.id);
    console.log(document.getElementById("search-bar").innerHTML)

    /**
     * Insert the page-hiding CSS into the active tab,
     * then get the beast URL and
     * send a "beastify" message to the content script in the active tab.
     */
    function beastify(tabs) {

        browser.tabs.sendMessage(tabs[0].id, {
          command: "find",
          findQuery: document.getElementById("search-bar").innerHTML
        }).then(() => {
          console.log("query complete");
        });
    }

    /**
     * Remove the page-hiding CSS from the active tab,
     * send a "reset" message to the content script in the active tab.
     */
    function reset(tabs) {
      browser.tabs.removeCSS({code: hidePage}).then(() => {
        browser.tabs.sendMessage(tabs[0].id, {
          command: "reset",
        });
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
     * then call "beastify()" or "reset()" as appropriate.
     */
    if (e.target.id === "search-button") {
      browser.tabs.query({active: true, currentWindow: true})
        .then(beastify)
        .catch(reportError);
    }
    // else if (e.target.id === "search-button") {
    //   browser.tabs.query({active: true, currentWindow: true})
    //     .then(reset)
    //     .catch(reportError);
    // }

  });
}


/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(`Failed to execute beastify content script: ${error.message}`);
}


/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs.executeScript({file: "/content_scripts/find.js"})
.then(listenForClicks)
.catch(reportExecuteScriptError);