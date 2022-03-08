function getBlocklist() {
    chrome.storage.sync.get({
        'keywords': [],
        'regexes': [],
    }, stored => {
        const keywords = stored['keywords'].join('\n');
        document.getElementById('keywords').value = keywords;

        const regexes = stored['regexes'].join('\n');
        document.getElementById('regexes').value = regexes;
    });
}

function saveBlocklist() {
    const keywords = document.getElementById('keywords').value;
    const regexes = document.getElementById('regexes').value;

    chrome.storage.sync.set({
        keywords: keywords.split('\n').filter(b => b.trim()),
        regexes: regexes.split('\n').filter(b => b.trim()),
    });
}

document.addEventListener('DOMContentLoaded', () => {
    getBlocklist();
    document.getElementById('save-btn').addEventListener('click', saveBlocklist);
});
