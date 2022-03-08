function getBlocklist() {
    chrome.storage.sync.get({
        'keywords': [],
        'regexes': [],
    }, ({ keywords, regexes }) => {
        const keywordsText = keywords.join('\n');
        document.getElementById('keywords').value = keywordsText;

        const regexesText = regexes.join('\n');
        document.getElementById('regexes').value = regexesText;
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
