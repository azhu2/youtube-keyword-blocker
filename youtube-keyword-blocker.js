const BLOCKED_KEYWORDS = [
    'Minecraft',
    /^Mix - /,
    'Hermitcraft',
];

function checkVideo(videoElement) {
    const title = videoElement.querySelector('#video-title').innerText;
    for (const keyword of BLOCKED_KEYWORDS) {
        if (title.search(keyword) > -1) {
            console.log('BLOCKED! ' + title);
            videoElement.classList.add('youtube-keyword-blocked');
        }
    }
}

function checkRow(rowElement) {
    for (const video of rowElement.getElementsByTagName('ytd-rich-item-renderer')) {
        checkVideo(video);
    }
}

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

findWrapperElement(setupObserver);
