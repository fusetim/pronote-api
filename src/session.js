const { initCipher } = require('./cipher');

const sessions = {};

function createSession({ serverURL, sessionID, type, disableAES, disableCompress, keyModulus, keyExponent })
{
    const session = {
        id: ~~sessionID,
        server: getServer(serverURL),
        target: getTarget(type),

        request: -1,

        disableAES,
        disableCompress
    };

    initCipher(session, keyModulus, keyExponent);

    return session;
}

function getServer(url)
{
    if (url.endsWith('.html')) {
        return url.substring(0, url.lastIndexOf('/') + 1);
    }

    if (!url.endsWith('/')) {
        url += '/';
    }

    return url;
}

function getSessions()
{
    return Object.values(sessions);
}

function removeSession(session)
{
    delete sessions[session.id];
}

function getTarget(type)
{
    switch (type)
    {
        default:
            return { name: 'unknown', id: type }
    }
}

module.exports = {
    createSession,
    getSessions,
    removeSession
};
