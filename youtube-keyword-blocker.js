const BLOCKED_KEYWORDS = ['Minecraft', /^Mix - /];

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

const setupObserver = wrapperElement => {
    const observer = new MutationObserver(mutations => {
        for (const { addedNodes } of mutations) {
            for (const node of addedNodes) {
                for (const video of node.getElementsByTagName('ytd-rich-item-renderer')) {
                    const title = video.querySelector('#video-title').innerText;
                    for (const keyword of BLOCKED_KEYWORDS) {
                        if (title.search(keyword) > -1) {
                            console.log('BLOCKED! ' + title);
                            video.classList.add('youtube-keyword-blocked');
                        }
                    }
                }
            }
        }
    });

    observer.observe(wrapperElement, {
        childList: true,
    });
};

findWrapperElement(setupObserver);
