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


  // Array to store all highlight elements
  let currentHighlights = [];

  /**
   * 
   */
  function searchForQuery(query) {
    console.log("query received: " + query);
    if (query === "" ) {
      return;
    }

    // console.log(document.body.innerText);
    console.log(document.body.children[0].children);
    // document.body.text

    const allTextNodes = textNodesUnder(document.body);
    console.log(allTextNodes);


    let results = [];


    // let testRange = document.createRange();
    // testRange.setStart(allTextNodes[7], 0);
    // testRange.setEnd(allTextNodes[7], 10);

    // Iterate over text nodes to find query
    for (let i = 0; i < allTextNodes.length; i++) {
      let currentText = allTextNodes[i].textContent;

      let searchIndex = currentText.search(query);

      let currentTextOffset = 0;

      let rangesToHighlight = [];

      while (searchIndex !== -1) {
        console.log(currentText);
        console.log(searchIndex);
        console.log(currentTextOffset);

        let newRange = document.createRange();
        newRange.setStart(allTextNodes[i], currentTextOffset + searchIndex);
        newRange.setEnd(allTextNodes[i], currentTextOffset + searchIndex + query.length);    
        rangesToHighlight.push(newRange);

        if (searchIndex + query.length >= currentText.length) {
          break;
        }
        currentTextOffset += searchIndex + query.length;
        currentText = currentText.slice(searchIndex + query.length);
        searchIndex = currentText.search(query);
      }

      for (let j = 0; j < rangesToHighlight.length; j++) {
        const newHighlight = highlightRange(rangesToHighlight[j]);
        currentHighlights.push(newHighlight);

        results.push({nodeIndex: i, offset: currentTextOffset + searchIndex, resultID: results.length, text: query});
      }
    }

    browser.runtime.sendMessage({
      command: "receive-results",
      results: results 
    });

  }


  // Remove all previous highlights from the page
  function removeHighlights() {
    const highlights = document.getElementsByClassName('find-highlight');
    for (let i = 0; i < highlights.length; i++) {
      let highlight = highlights[i];
      let parent = highlight.parentNode;
      parent.insertBefore(highlight.firstChild, highlight);
    }
    // Remove highlights after all additions have been made so the contents are not edited in the middle
    for (let i = 0; i < highlights.length; i++) {
      highlights[i].parentNode.removeChild(highlights[i]);
    }
  }
  // Highlight all the text inside a Range
  function highlightRange(textRange) {
    const highlightNode = document.createElement("span");

    // Set styles of highlight
    highlightNode.style.backgroundColor = "#EEEE00";
    highlightNode.style.color = "#111111";
    highlightNode.style.fontSize = "inherit";

    // Add class so that highlight can be removed later
    highlightNode.classList.add("find-highlight");

    textRange.surroundContents(highlightNode);

    return highlightNode;
  }

  // taken from: https://stackoverflow.com/questions/10730309/find-all-text-nodes-in-html-page
  // Gets all text nodes that are under an element
  function textNodesUnder(el){
    var n, a=[], walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null,false);
    while(n=walk.nextNode()) a.push(n);
    return a;
  }

  function searchHTMLRecursive(node, query) {
    var results = []
    console.log("RECURSED");
    let textnodecount = 0;
    for (var i = 0; i < node.children.length; i++) {
      console.log("Hello!");
      var child = node.children[i];
      console.log(child);
      searchHTMLRecursive(child, query);
      if (child.nodeType == Node.TEXT_NODE) {
        textnodecount += 1;
      }
    }

    console.log(textnodecount);
  }

  /**
   * Reset
   */
  function clearResults() {
    console.log("CLEAR");
    currentHighlights = [];
    removeHighlights();
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
    else if (message.command === "focus-on-result") {
      console.log("FOCUSING ON RESULT: " + message.resultID);
      currentHighlights[message.resultID].scrollIntoView();
      currentHighlights[message.resultID].style.backgroundColor = "red";

    }
  });

})();
