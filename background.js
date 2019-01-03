'use strict';

let myWork = 'js/steam_extend10.js';
let strSteamCommunity = "steamcommunity";

browser.commands.onCommand.addListener(function(command) {
  if (command == "cmd_update") {
	chrome.tabs.executeScript(
        chrome.tabs[0],
        {file: myWork});
  }
});


browser.browserAction.onClicked.addListener((tab) => {

  	if(  -1 != tab.url.indexOf(strSteamCommunity)  ){

	chrome.tabs.executeScript(
        chrome.tabs[0],
        {file: myWork});

  	}
});