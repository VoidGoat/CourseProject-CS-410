# Course Project - Flexible Find Browser Extension (kahaas)

This final project is a Firefox browser extension that allows for a more flexible way to search for content in webpages.

The documentation is in `Documentation.pdf`

The Software Usage Tutorial is at this link: [https://www.youtube.com/watch?v=y879CxwUx7w](https://www.youtube.com/watch?v=y879CxwUx7w)

The proposal is in `ProjectProposal.pdf`

The progress report is in `ProgressReport.pdf`

# Setup
To use this Firefox extension download the files, then navigate to `about:debugging` in Firefox and select "This Firefox". Press the "Load Temporary Add-on..." button and select any of the downloaded files from this extension. The extension will then be loaded in Firefox.

# Rebuilding
If you are making changes to `find.js` or any files in `wordnetjson` then you must rebuild the scripts using browserify. You first need to install browserify as described here: https://browserify.org/

Navigate to the content_scripts directory and run `browserify find.js -o bundle.js`, this will bundle all necessary files together.

# Citations
Using fuzzyset.js from https://github.com/Glench/fuzzyset.js for approximate string matching

Using wordnet.js from https://github.com/nlp-compromise/wordnet.js with some modifications to the data. All unnecessary data has been stripped out to improve performance.

Using browserify to package libraries: https://browserify.org/ 

and the WordNet data is originally from: Princeton University "About WordNet." WordNet. Princeton University. 2010. https://wordnet.princeton.edu/
