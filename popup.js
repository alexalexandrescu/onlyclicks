document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggle');
  const status = document.getElementById('status');
  const clickCountsElement = document.getElementById('clickCounts');
  const lifetimeClicksElement = document.getElementById('lifetimeClicks');

  function sendMessageToContentScript() {
    const isChecked = toggle.checked;
    chrome.storage.sync.set({ enabled: isChecked }, () => {
      const message = isChecked ? 'enabled' : 'disabled';
      status.textContent = `Button Clicker is ${message}`;
      console.log(`Toggle state saved: ${isChecked}`);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'toggle', enabled: isChecked });
      });
    });
  }

  toggle.addEventListener('change', () => {
    sendMessageToContentScript();
  });

  chrome.storage.sync.get('enabled', ({ enabled }) => {
    toggle.checked = enabled;
    const message = enabled ? 'enabled' : 'disabled';
    status.textContent = `Button Clicker is ${message}`;
    console.log(`Toggle state retrieved: ${enabled}`);
  });

  // Retrieve and display the click counts
  chrome.storage.sync.get(['clickCounts', 'lifetimeClicks'], ({ clickCounts, lifetimeClicks }) => {
    for (const [username, count] of Object.entries(clickCounts || {})) {
      const li = document.createElement('li');
      li.textContent = `${username}: ${count}`;
      clickCountsElement.appendChild(li);
    }
    console.log(`Click counts retrieved:`, clickCounts);

    lifetimeClicksElement.textContent = `Lifetime clicks: ${lifetimeClicks || 0}`;
    console.log(`Lifetime clicks retrieved: ${lifetimeClicks || 0}`);
  });

  // Add a delay to make sure the content script is loaded before sending a message
  setTimeout(() => {
    sendMessageToContentScript();
  }, 500);
});

chrome.storage.sync.get(['clickCounts', 'lifetimeClicks'], ({ clickCounts }) => {
  // Calculate the total number of clicks
  const totalClicks = Object.values(clickCounts || {}).reduce((acc, count) => acc + count, 0);

  // Store the total number of clicks
  chrome.storage.sync.set({ lifetimeClicks: totalClicks }, () => {
    console.log(`Lifetime clicks saved: ${totalClicks}`);
  });
});
