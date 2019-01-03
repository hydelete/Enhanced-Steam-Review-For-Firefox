'use strict';

let tapButton = document.getElementById('tapButton');

let myWork = 'js/steam_extend10.js';

tapButton.onclick = function(element) {
    
	chrome.tabs.executeScript(
        chrome.tabs[0],
        {file: myWork});
	
};