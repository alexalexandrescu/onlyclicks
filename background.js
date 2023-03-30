console.log("background.js", "Button Clicker extension loaded.");

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "extensionLoaded") {
    console.log("Button Clicker extension loaded in page.");
  }
});
