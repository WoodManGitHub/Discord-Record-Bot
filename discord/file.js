module.exports = (discordClient) => {
    sendFile = (channelID, fileData, fileName) => {
        discordClient.createMessage(channelID, '', {
            file: fileData,
            name: fileName
        })
    }
}
