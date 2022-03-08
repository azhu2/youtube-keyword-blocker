function checkVideo(videoElement, blocklist) {
    // Hide ads in case adblocker fails. Also prevents next line from complaining on missing #video-title
    if (videoElement.getElementsByTagName('ytd-display-ad-renderer').length > 0) {
        hideVideo(videoElement);
        return;
    }

    const title = videoElement.querySelector('#video-title').innerText;
    for (const keyword of blocklist) {
        if (title.search(keyword) > -1) {
            console.log('BLOCKED! ' + title);
            hideVideo(videoElement);
            markNotInterested(videoElement);
        }
    }
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

/** Iterate over each video on a row */
function checkRow(rowElement, blocklist) {
    for (const video of rowElement.getElementsByTagName('ytd-rich-item-renderer')) {
        checkVideo(video, blocklist);
    }
}

/** Set up observer on new rows being added to main video wrapper */
function setupObserver(wrapperElement, blocklist) {
    const observer = new MutationObserver(mutations => {
        for (const { addedNodes } of mutations) {
            for (const node of addedNodes) {
                checkRow(node, blocklist);
            }
        }
    });

    observer.observe(wrapperElement, {
        childList: true,
    });

    for (const node of wrapperElement.childNodes) {
        checkRow(node, blocklist);
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
  * Returns promise that resolves with array of strings+RegExps */
function getBlocklist() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get({
            'keywords': [],
            'regexes': [],
        }, ({ regexes, keywords }) => {
            resolve(regexes
                .map(str => new RegExp(str))
                .concat(keywords)
            );
        });
    });
}

function init() {
    Promise.all([
        findWrapperElement(),
        getBlocklist(),
    ]).then(([ wrapperElement, blocklist ]) => setupObserver(wrapperElement, blocklist));
}

init();
