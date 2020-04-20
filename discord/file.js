module.exports = (discordClient) => {
    global.discord.sendFile = (channelID, fileData, fileName) => {
        discordClient.createMessage(channelID, '', {
            file: fileData,
            name: fileName
        })
    }
}
