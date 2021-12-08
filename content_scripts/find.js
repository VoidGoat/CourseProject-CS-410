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


  // // insert wordnet script
  // const script = document.createElement('script');
  // script.setAttribute("type", "module");
  // script.setAttribute("src", browser.runtime.getURL('content_scripts/wordnet-js/lib/wordnet.js'));
  // const head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
  // head.insertBefore(script, head.lastChild);


  // Array to store all highlight elements
  let currentHighlights = [];

  /**
   * Searches for a query in the page and sends results to popup 
   */
  function searchForQuery(query) {
    console.log("query received: " + query);


    // import WordNet
    let wn = require("./wordnetjson/index.js");
    console.log(wn.lookup(query));


    // Clear results before doing anything else
    clearResults();

    // Do not parse empty queries
    // TODO: Expand so that all blank queries are ignored
    if (query === "" ) {
      return;
    }

    let fuzzySet = FuzzySet();
    fuzzySet.add(query);

    // Get all text nodes on the page
    const allTextNodes = textNodesUnder(document.body);
    console.log(allTextNodes);

    // array to store objects for each match found
    let results = [];

    // NEW VERSION OF SEARCH
    for (let i = 0; i < allTextNodes.length; i++) {
      let currentText = allTextNodes[i].textContent.toLowerCase();
      let searchResults = fuzzySearch(currentText, query, 0.0);


      // Array of ranges that should be highlighted
      let rangesToHighlight = [];

      for (let resultIdx = 0; resultIdx < searchResults.length; resultIdx++) {
        let searchResult = searchResults[resultIdx];
        let foundText = searchResult[0];
        let similarityScore = searchResult[1];
        let textOffset = searchResult[2];
        let textLength = searchResult[3];

        // Create range to highlight current result
        let newRange = document.createRange();
        newRange.setStart(allTextNodes[i], textOffset);
        newRange.setEnd(allTextNodes[i], textOffset + textLength);    
        rangesToHighlight.push(newRange);

        results.push({nodeIndex: i, offset: textOffset, resultID: results.length, text: foundText, score: similarityScore});
      }

      // Highlight found text 
      for (let j = 0; j < rangesToHighlight.length; j++) {
        const newHighlight = highlightRange(rangesToHighlight[j]);
        currentHighlights.push(newHighlight);
      }

    }

    // Sort results array
    results = results.sort(function compareFn(firstEl, secondEl) { if (firstEl.score < secondEl.score) { return 1; } else { -1; } });

    // Iterate over text nodes to find query
    // for (let i = 0; i < allTextNodes.length; i++) {
    //   let currentText = allTextNodes[i].textContent.toLowerCase();

    //   // let searchIndex = currentText.search(query);
    //   let searchIndex = fuzzySearch(currentText, query);

    //   let currentTextOffset = 0;

    //   let rangesToHighlight = [];

    //   while (searchIndex !== -1) {
    //     console.log(currentText);
    //     console.log(searchIndex);
    //     console.log(currentTextOffset);

    //     let newRange = document.createRange();
    //     newRange.setStart(allTextNodes[i], currentTextOffset + searchIndex);
    //     newRange.setEnd(allTextNodes[i], currentTextOffset + searchIndex + query.length);    
    //     rangesToHighlight.push(newRange);

    //     if (searchIndex + query.length >= currentText.length) {
    //       break;
    //     }
    //     currentTextOffset += searchIndex + query.length;
    //     currentText = currentText.slice(searchIndex + query.length);

    //     // searchIndex = currentText.search(query);
    //    searchIndex = fuzzySearch(currentText, query);

    //   }

    //   for (let j = 0; j < rangesToHighlight.length; j++) {
    //     const newHighlight = highlightRange(rangesToHighlight[j]);
    //     currentHighlights.push(newHighlight);

    //     results.push({nodeIndex: i, offset: currentTextOffset + searchIndex, resultID: results.length, text: query});
    //   }
    // }

    browser.runtime.sendMessage({
      command: "receive-results",
      results: results 
    });

  }

  // Does fuzzy search for a query over a string of text and returns all matches over a certain threshold
  function fuzzySearch(text, query, threshold) {
    // Using FuzzySet implementation from https://github.com/Glench/fuzzyset.js
    let fuzzySet = FuzzySet();
    fuzzySet.add(query);

    // Array to store similarities of all subsections
    let similarities = [];

    // Remove invisible chars
    // text = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

    // iterate over all possible words in the text
    for (let offset = 0; offset <= text.length - query.length; offset++) {
      

      let extraLength = 0;
      // while (offset + query.length + extraLength < text.length && text.slice(offset, offset + query.length + extraLength).replace(/[\u0000-\u001F\u007F-\u009F]/gi, "").length < query.length) {
      //   extraLength += 1;
      // }
      // Get current slice of text
      let currentSlice = text.slice(offset, offset + query.length + extraLength);

      // currentSlice = currentSlice.replace(/[\u0000-\u001F\u007F-\u009F]/gi, "");

      // Get similarity between slice and query
      let fuzzScore = fuzzySet.get(currentSlice);

      // If there is no similarity continue
      if (fuzzScore == null) {
        continue;
      }

      let similarity = fuzzScore[0][0];

      // If similarity score passes threshold then save this result
      if (similarity > threshold) {
        // If current slice overlaps with previous then only add it if it has higher score
        // console.log(currentSlice);
        // console.log(currentSlice.length);
        const similarityResult = [currentSlice, similarity, offset, currentSlice.length + extraLength];
        if (similarities.length === 0) {
            similarities.push(similarityResult)
        } else if (similarities[similarities.length - 1][2] + similarities[similarities.length - 1][3] <= offset) {
          similarities.push(similarityResult)
        } else if (similarities[similarities.length - 1][1] < similarity) {
          // Replace previous result if new result has a higher score
          similarities[similarities.length - 1] = similarityResult;
        }
        // offset += currentSlice.length;
      }
    }

    // Prune overlapping results


    return similarities;
  }


  // Remove all previous highlights from the page
  function removeHighlights() {
    const highlights = document.getElementsByClassName('find-highlight');
    for (let i = 0; i < highlights.length; i++) {
    }
    // Remove highlights after all additions have been made so the contents are not edited in the middle
    for (let i = highlights.length - 1; i >= 0; i--) {
      let highlight = highlights[i];
      let parent = highlight.parentNode;
      parent.insertBefore(highlight.firstChild, highlight);

      highlights[i].remove();
      parent.normalize();
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


  /**
   * Reset
   */
  function clearResults() {
    console.log("CLEAR");
    removeHighlights();
    currentHighlights = [];
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

      const previousFocus = document.getElementsByClassName("main-highlight");
      for (let i = 0; i < previousFocus.length; i++) {
        previousFocus[i].classList.remove("main-highlight");

      }

      currentHighlights[message.resultID].scrollIntoView({behavior: "smooth"});
      // currentHighlights[message.resultID].style.backgroundColor = "red";
      currentHighlights[message.resultID].classList.add("main-highlight");

    }
  });

})();
