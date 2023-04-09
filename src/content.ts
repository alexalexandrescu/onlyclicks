// Log that the extension has been loaded
console.log("Button Clicker extension loaded.");

// Declare and initialize variables and constants
let extensionEnabled = false;
let clickingButton = false;
const favoriteButtonClass = '.set-favorite-btn'; // class name for the favorite button
let clickQueue: Element[] = []; // queue of buttons to click
const MIN_WAIT_INTERVAL = 1000; // minimum time to wait between button clicks in milliseconds (0.5 seconds)
const MAX_WAIT_INTERVAL = 2000; // maximum time to wait between button clicks in milliseconds (1 second)
const SCROLL_INTERVAL = 3000; // time to wait between scrolling to next unclicked post in milliseconds (2 seconds)
let currentParentIndex = 0; // index of the current post element being checked for unclicked button
let scrollIntervalId: number | null;
let usernameLikes: Map<string, number>;
let likedPosts: Map<string, boolean>;
chrome.storage.local.get(
  ["clickCounts", "clickedPostIds"],
  ({clickCounts, clickedPostIds}) => {
    usernameLikes = new Map(clickCounts && Object.entries(clickCounts) || null);
    likedPosts = new Map(clickedPostIds && Object.entries(clickedPostIds) || null);
  }
);
const batchStorageUpdate = () => {
  console.log('Attempting storage update...');
  chrome.storage.local.get(
    ["clickCounts", "clickedPostIds"],
    async ({clickCounts, clickedPostIds}) => {
      console.log('Storage update');
      let stateChanged = false;
      if (!clickCounts || !compareMapAndObject(usernameLikes, clickCounts)) {
        console.log('Updating storage for user likes', Object.fromEntries(usernameLikes));
        await chrome.storage.local.set(
          {clickCounts: Object.fromEntries(usernameLikes)}
        );
        stateChanged = true;
      }

      if (!clickedPostIds || likedPosts.size !== Object.keys(clickedPostIds).length) {
        console.log('Updating storage for licked posts');
        await chrome.storage.local.set(
          {clickedPostIds: Object.fromEntries(likedPosts)}
        );
        stateChanged = true;
      }

      if (stateChanged) {
        chrome.runtime.sendMessage({type: "storageUpdated"});
      }
    }
  );
}

const debounce = (func: () => void, delay: number) => {
  console.log('called debounce');
  let timerId: any;
  return (...args: []) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
};
const callDebounce = debounce(() => {
  batchStorageUpdate();
}, 3000);

const compareMapAndObject = (map: Map<string, number>, object: Record<string, number>): boolean => {
  const mapKeys = Array.from(map.keys());
  const objectKeys = Object.keys(object);

  return mapKeys.length === objectKeys.length && mapKeys.every((key: string) => map.get(key) === object[key]);
};

// Function to count the number of times each user's favorite button was clicked
const countClickedFavoriteButtons = () => {
  console.log("Counting clicked favorite buttons...");
  const clickedButtons = document.querySelectorAll(
    `${favoriteButtonClass}.m-active`
  );
  clickedButtons.forEach((button) => {
    const postElement = button.closest(".b-post");
    if (postElement) {
      const username = postElement.querySelector(".g-user-username")?.textContent?.trim();
      const postId = postElement.id;

      if (!likedPosts.has(postId) && username) {
        // Add the postId to clickedPostIds to mark it as clicked
        likedPosts.set(postId, true);
        usernameLikes.set(username, (usernameLikes.get(username) || 0) + 1);
        callDebounce();
      }
    }
  });
};

// Function to scroll to the next unliked post
const scrollToNextUnlikedPost = () => {
  const posts = document.querySelectorAll(".b-post");
  let unlikedPostFound = false;

  while (currentParentIndex < posts.length && !unlikedPostFound) {
    const post = posts[currentParentIndex];
    const button = post.querySelector(favoriteButtonClass);
    if (!button?.classList.contains("m-active")) {
      unlikedPostFound = true;
      post.scrollIntoView({behavior: "smooth"});
    }
    currentParentIndex++;
  }

  if (!unlikedPostFound) {
    const bottomScrollPos = document.body.scrollHeight;
    window.scrollTo({top: bottomScrollPos, behavior: "smooth"});
  }
};

const clickButton = () => {
  if (!clickingButton) {
    console.log('clickButton called');
    const button = clickQueue.shift() as HTMLElement;
    if (button) {
      button.click();
      // clickingButton = false;

      // Extract the username from the parent b-post element
      const postElement = button.closest(".b-post");
      if (postElement) {
        const username = postElement.querySelector(".g-user-username")?.textContent?.trim();
        const postId = postElement.id;

        // Check if the post has already been clicked and increase the count

        if (!likedPosts.has(postId) && username) {
          likedPosts.set(postId, true);
          usernameLikes.set(username, (usernameLikes.get(username) || 0) + 1);
          callDebounce();

          console.log(
            `Button clicked for user ${username}! Total clicks: ${
              usernameLikes.get(username)
            }`
          );
        }
      }
    }
  }
};

// clickButton function to click the favorite button
const buttonClickAppend = (button: Element) => {
  if (button) {
    clickQueue.push(button);
    setTimeout(() => {
      clickButton();
    }, Math.floor(Math.random() * (MAX_WAIT_INTERVAL - MIN_WAIT_INTERVAL + 1)) + MIN_WAIT_INTERVAL);
  }
};

// IntersectionObserver to detect when the favorite button is in view
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting && !entry.target.classList.contains("m-active")) {
      buttonClickAppend(entry.target);
      console.log("Button clicked!");
    }
  });
}, {
  root: null,
  threshold: 0.5,
});

const observeButtons = () => {
  document.querySelectorAll(favoriteButtonClass).forEach((button) => {
    if (!button.classList.contains("m-active")) {
      observer.observe(button);
    } else {
      console.log("Button already clicked");
    }
  });
};

// Detect when new elements are added to the DOM
const mutationObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "childList" && extensionEnabled) {
      observeButtons();
      countClickedFavoriteButtons();
    }
  });
});

mutationObserver.observe(document.body, {
  childList: true,
  subtree: true,
});

chrome.runtime.sendMessage({type: "extensionLoaded"});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "toggle") {
    if (request.enabled) {
      extensionEnabled = true;
      console.log("Button Clicker is enabled");
      observeButtons();
      countClickedFavoriteButtons();
    } else {
      extensionEnabled = false;
      console.log("Button Clicker is disabled");
      document.querySelectorAll(favoriteButtonClass).forEach((button) => {
        observer.unobserve(button);
      });
    }
  }

  if (request.type === "idle") {
    if (request.enabled) {
      console.log("Idle mode enabled");
      scrollIntervalId = setInterval(
        scrollToNextUnlikedPost,
        SCROLL_INTERVAL
      );
    } else {
      console.log("Idle mode disabled");
      scrollIntervalId && clearInterval(scrollIntervalId);
      scrollIntervalId = null;
    }
  }
});

