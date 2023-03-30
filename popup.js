document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggle');
  const status = document.getElementById('status');
  const clickCountsElement = document.getElementById('clickCounts');
  const totalClicksElement = document.getElementById('totalClicks');

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
  chrome.storage.sync.get(['clickCounts', 'totalClicks'], ({ clickCounts, totalClicks }) => {
    for (const [username, count] of Object.entries(clickCounts || {})) {
      const li = document.createElement('li');
      li.textContent = `${username}: ${count}`;
      clickCountsElement.appendChild(li);
    }
    console.log(`Click counts retrieved:`, clickCounts);

    totalClicksElement.textContent = `Lifetime clicks: ${totalClicks || 0}`;
    console.log(`Total clicks retrieved: ${totalClicks || 0}`);
  });

  // Add a delay to make sure the content script is loaded before sending a message
  setTimeout(() => {
    sendMessageToContentScript();
  }, 500);
});

chrome.storage.sync.get('clickCounts', ({ clickCounts }) => {
  // Calculate the total number of clicks
  const totalClicks = Object.values(clickCounts || {}).reduce
