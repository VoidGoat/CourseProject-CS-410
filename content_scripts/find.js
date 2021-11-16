(function() {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  /**
   * 
   */
  function searchForQuery(query) {
    console.log("query: " + query);
  }


  /**
   * Reset
   */
  function clearResults() {
    console.log("CLEAR");
  }

  /**
   * Listen for messages from the background script.
   * Call "insertBeast()" or "removeExistingBeasts()".
   */
  browser.runtime.onMessage.addListener((message) => {
    if (message.command === "find") {
      
      searchForQuery(message.findQuery);
    } else if (message.command === "reset") {
      clearResults();
    }
  });

})();
