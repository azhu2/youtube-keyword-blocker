const BLOCKED_KEYWORDS = [
    'Minecraft',
    /^Mix - /,
    'Hermitcraft',
];

function checkVideo(videoElement) {
    // Hide ads in case adblocker fails. Also prevents next line from complaining on missing #video-title
    if (videoElement.getElementsByTagName('ytd-display-ad-renderer').length > 0) {
        hideVideo(videoElement);
        return;
    }

    const title = videoElement.querySelector('#video-title').innerText;
    for (const keyword of BLOCKED_KEYWORDS) {
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
    openVideoMenu(videoElement, clickNotInterested);
}

/** Finds 3-dots menu button, clicks it, and calls callback */
function openVideoMenu(videoElement, callback) {
    // Open menu
    const menuElement = videoElement.querySelector('#menu');
    var menuButton = menuElement.querySelector('.ytd-menu-renderer button');
    if (!menuButton) {
        // Annoyingly, the menu button can take multiple seconds to render, so set up an observer
        const menuObserver = new MutationObserver((mutations, observer) => {
            menuButton = menuElement.querySelector('.ytd-menu-renderer button');
            if (menuButton) {
                observer.disconnect();
                menuButton.click();
                callback();
            }
        });

        menuObserver.observe(menuElement, {
            childList: true,
            subtree: true,
        })
    } else {
        menuButton.click();
        callback();
    }
}

/** Click 'Not interested' button (in separate floating menu element) */
function clickNotInterested(menuButton) {
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
function checkRow(rowElement) {
    for (const video of rowElement.getElementsByTagName('ytd-rich-item-renderer')) {
        checkVideo(video);
    }
}

/** Set up observer on new rows being added to main video wrapper */
function setupObserver(wrapperElement) {
    const observer = new MutationObserver(mutations => {
        for (const { addedNodes } of mutations) {
            for (const node of addedNodes) {
                checkRow(node);
            }
        }
    });

    observer.observe(wrapperElement, {
        childList: true,
    });

    for (const node of wrapperElement.childNodes) {
        checkRow(node);
    }
};

/** Poll for main container rendered. Happens after document.onload */
function findWrapperElement(callback) {
    const wrapperInterval = setInterval(pollForWrapper, 100);
    function pollForWrapper() {
        const wrapperElement = document.getElementById('contents');
        if (wrapperElement) {
            clearInterval(wrapperInterval);
            callback(wrapperElement);
        }
    }
}

function init() {
    findWrapperElement(setupObserver);
}

init();
