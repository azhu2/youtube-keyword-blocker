function getBlocklist() {
    chrome.storage.sync.get({
        'keywords': [],
        'regexes': [],
        'artists': false
    }, ({ keywords, regexes, artists }) => {
        const keywordsText = keywords.join('\n');
        document.getElementById('keywords').value = keywordsText;

        const regexesText = regexes.join('\n');
        document.getElementById('regexes').value = regexesText;

        document.getElementById('artists').checked = artists;
    });
}

function saveBlocklist() {
    const keywords = document.getElementById('keywords').value;
    const regexes = document.getElementById('regexes').value;
    const artists = document.getElementById('artists').checked;

    chrome.storage.sync.set({
        keywords: keywords.split('\n').filter(b => b.trim()),
        regexes: regexes.split('\n').filter(b => b.trim()),
        artists: artists
    });
}

document.addEventListener('DOMContentLoaded', () => {
    getBlocklist();
    document.getElementById('save-btn').addEventListener('click', saveBlocklist);
});
