function checkVideo(videoElement, blocklist) {
    // Hide ads in case adblocker fails. Also prevents next line from complaining on missing #video-title
    if (videoElement.getElementsByTagName('ytd-display-ad-renderer').length > 0) {
        hideVideo(videoElement);
        return;
    }

    const title = videoElement.querySelector('#video-title').innerText;
    if (blocklist.artists) {
        if (videoElement.querySelector('.badge-style-type-verified-artist')) {
            rejectVideo(title, videoElement);
            return;
        }
    }
    for (const keyword of blocklist.regexes) {
        if (title.search(keyword) > -1) {
            rejectVideo(title, videoElement);
            return;
        }
    }
}

function rejectVideo(title, videoElement) {
    console.log('BLOCKED! ' + title);
    hideVideo(videoElement);
    markNotInterested(videoElement);
}

function hideVideo(videoElement) {
    videoElement.classList.add('youtube-keyword-blocked');
}

function markNotInterested(videoElement) {
    openVideoMenu(videoElement)
        .then(clickNotInterested);
}

/** Finds 3-dots menu button and clicks it. Returns empty promise that resolves once menu is open */
function openVideoMenu(videoElement) {
    // Open menu
    const menuElement = videoElement.querySelector('#menu');
    var menuButton = menuElement.querySelector('.ytd-menu-renderer button');
    if (!menuButton) {
        // Annoyingly, the menu button can take multiple seconds to render, so set up an observer
        return new Promise((resolve, reject) => {
            const menuObserver = new MutationObserver((mutations, observer) => {
                menuButton = menuElement.querySelector('.ytd-menu-renderer button');
                if (menuButton) {
                    observer.disconnect();
                    menuButton.click();
                    resolve();
                }
            });

            menuObserver.observe(menuElement, {
                childList: true,
                subtree: true,
            });
        });
    } else {
        menuButton.click();
        return Promise.resolve();
    }
}

/** Click 'Not interested' button (in separate floating menu element) */
function clickNotInterested() {
    // Timeout's probably not ideal, but seems to work.
    // Possible issues with clicking wrong button (previous video's menu) or calling before menu renders.
    setTimeout(() => {
        const menuElement = document.body.querySelector('ytd-menu-popup-renderer')
        for (const option of menuElement.getElementsByTagName('yt-formatted-string')) {
            if (option.innerText === 'Not interested') {
                option.click();
            }
        }
    }, 10);
}

/** Set up observer on new rows being added to main video wrapper */
function setupObserver(wrapperElement, blocklist) {
    const observer = new MutationObserver(mutations => {
        for (const { addedNodes } of mutations) {
            for (const node of addedNodes) {
                if (node.nodeName.toLowerCase() === 'ytd-rich-item-renderer') {
                    checkVideo(node, blocklist);
                }
            }
        }
    });

    observer.observe(wrapperElement, {
        childList: true,
        subtree: true,
    });

    for (const node of wrapperElement.querySelectorAll('ytd-rich-item-renderer')) {
        checkVideo(node, blocklist);
    }
};

/** Poll for main container rendered since it happens after document.onload.
  * Returns promise that resolves with main container element. */
function findWrapperElement() {
    return new Promise((resolve, reject) => {
        const wrapperInterval = setInterval(pollForWrapper, 100);
        function pollForWrapper() {
            const wrapperElement = document.getElementById('contents');
            if (wrapperElement) {
                clearInterval(wrapperInterval);
                resolve(wrapperElement);
            }
        }
    });
}

/** Fetch blocklist from storage.
  * Returns promise that resolves with object with array of strings+RegExps and artists flag */
function getBlocklist() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get({
            'keywords': [],
            'regexes': [],
            'artists': false
        }, ({ regexes, keywords, artists }) => {
            resolve({
                regexes: regexes
                    .map(str => new RegExp(str))
                    .concat(keywords),
                artists: artists
            });
        });
    });
}

function findAdblockerElement() {
    return new Promise((resolve, reject) => {
        const adblockerInterval = setInterval(pollForAdblocker, 100);
        function pollForAdblocker() {
            const adblockerElement = document.getElementsByTagName('ytd-enforcement-message-view-model')[0];
            if (adblockerElement) {
                clearInterval(adblockerInterval);
                resolve(adblockerElement);
            }
        }
    });
}

function killAdblocker(adblockerElement) {
    const closeButton = adblockerElement.querySelector('yt-button-view-model');
    closeButton.click();
    console.log('Adblocker-blocker killed')
}

function init() {
    Promise.all([
        findWrapperElement(),
        getBlocklist(),
    ]).then(([ wrapperElement, blocklist ]) => setupObserver(wrapperElement, blocklist));

    findAdblockerElement().then(e => killAdblocker);
}

init();
