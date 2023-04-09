
document.addEventListener('DOMContentLoaded', () => {
  const enabledToggleElement = document.getElementById('toggle');
  const clickCountsElement = document.getElementById('clickCounts');
  const idleToggleElement = document.getElementById('idle');
  const resetBtnElement = document.getElementById('resetBtn');

  alert('popup domcontentloaded');
  function updateTitle(enabled) {
    const title = document.getElementById('title');
    if (enabled) {
      title.classList.add('enabled');
    } else {
      title.classList.remove('enabled');
    }
  }

  function sendMessageToContentScript(type, enabled) {
    if (type === 'toggle') {
      updateTitle(enabled);
    }

    chrome.storage.local.set({ [type]: enabled }, () => {
      console.log(`${type} state saved: ${enabled}`);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { type, enabled });
      });
    });
  }

  enabledToggleElement.addEventListener('change', () => {
    sendMessageToContentScript('toggle', enabledToggleElement.checked);
    chrome.storage.local.set({ enabled: enabledToggleElement.checked }, () => {});
  });

  idleToggleElement.addEventListener('change', () => {
    sendMessageToContentScript('idle', idleToggleElement.checked);
  });

  resetBtnElement.addEventListener('click', () => {
    chrome.storage.local.remove(['clickCounts', 'clickedPostIds'], () => {
      var error = chrome.runtime.lastError;
      if (error) {
        console.error(error);
      }
      // do something more
    });
  });

  chrome.storage.local.get('enabled', ({ enabled }) => {
    enabledToggleElement.checked = enabled;
    updateTitle(enabled);
    console.log(`Toggle state retrieved: ${enabled}`);
  });

  chrome.storage.local.get('idle', ({ idle }) => {
    idleToggleElement.checked = idle;
    console.log(`Idle state retrieved: ${idle}`);
  });

  // Retrieve and display the click counts
  const updateText = () => chrome.storage.local.get(['clickCounts'], ({ clickCounts }) => {
    console.log('update text', clickCounts);
    clickCountsElement.innerHTML = '';
    for (const [username, count] of Object.entries(clickCounts || {})) {
      console.log('clickCounts', username, count);
      const li = document.createElement('li');
      li.textContent = `${username}: ${count}`;
      clickCountsElement.appendChild(li);
    }
    console.log(`Click counts retrieved:`, clickCounts);

    // lifetimeClicksElement.textContent = `Lifetime likes: ${lifetimeClicks || 0}`;
    // console.log(`Lifetime clicks retrieved: ${lifetimeClicks || 0}`);
  });
  updateText();

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "storageUpdated") {
      updateText();
    }
  });

  // Add a delay to make sure the content script is loaded before sending a message
  setTimeout(() => {
    sendMessageToContentScript('toggle', enabledToggleElement.checked);
    sendMessageToContentScript('idle', idleToggleElement.checked);
  }, 500);
});
