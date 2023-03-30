console.log("Button Clicker extension loaded.");

const buttonClass = '.set-favorite-btn';
let buttonClicked = false;
let clickQueue = [];

function clickButton(button) {
  if (button && !buttonClicked) {
    buttonClicked = true;
    clickQueue.push(button);

    setTimeout(() => {
      const button = clickQueue.shift();
      button.click();
      buttonClicked = false;

      // Extract the username from the parent b-post element
      const username = button.closest('.b-post').querySelector('.g-user-username').textContent.trim();

      // Increase the click count for the user and save it to storage
      chrome.storage.sync.get('clickCounts', ({ clickCounts }) => {
        clickCounts = clickCounts || {};
        clickCounts[username] = (clickCounts[username] || 0) + 1;
        chrome.storage.sync.set({ clickCounts }, () => {
          console.log(`Button clicked for user ${username}! Total clicks: ${clickCounts[username]}`);
        });

        // Increase the lifetime click count and save it to storage
        chrome.storage.sync.get('lifetimeClicks', ({ lifetimeClicks }) => {
          lifetimeClicks = (lifetimeClicks || 0) + 1;
          chrome.storage.sync.set({ lifetimeClicks }, () => {
            console.log(`Button clicked! Lifetime clicks: ${lifetimeClicks}`);
          });
        });
      });

    }, Math.floor(Math.random() * (750 - 500 + 1)) + 500); // random interval between 0.5 and 2 seconds
  }
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting && !entry.target.classList.contains("m-active")) {
      clickButton(entry.target);
      console.log("Button clicked!");
    }
  });
}, {
  root: null,
  threshold: 0.5,
});

function observeButtons() {
  document.querySelectorAll(buttonClass).forEach((button) => {
    observer.observe(button);
  });
}

observeButtons();

// Detect when new elements are added to the DOM
const mutationObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      observeButtons();
    }
  });
});

mutationObserver.observe(document.body, { childList: true, subtree: true });

chrome.runtime.sendMessage({ type: "extensionLoaded" });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "toggle") {
    if (request.enabled) {
      console.log("Button Clicker is enabled");
      observeButtons();
    } else {
      console.log("Button Clicker is disabled");
      document.querySelectorAll(buttonClass).forEach((button) => {
        observer.unobserve(button);
      });
    }
  }
});
