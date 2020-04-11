module.exports = (telegramClient) => {
    global.telegram.sendAudio = (chatID, fileData, fileName, caption, contentType) => {
        telegramClient.sendAudio(chatID, fileData, {}, {
            filename: fileName,
            caption: caption,
            contentType: contentType
        })
        .catch(err => {
            console.error(err)
        })
    }
    global.telegram.sendDocument = (chatID, fileData, fileName, caption) => {
        telegramClient.sendDocument(chatID, fileData, {
            filename: fileName,
            caption: caption
        })
        .catch((err) => {
            console.error(err)
        })
    }
}
