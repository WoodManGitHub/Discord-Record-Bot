const Discord = require('eris')
const config = require('../config.json')
const RecordUtils = require('./recorder')
const FileUtils = require('./file')

module.exports = () => {
    const discordClient = new Discord(config.discord.config.token)

    console.log('[Discord] Conneting...')

    discordClient.on('ready', () => {
        console.log('[Discord] Ready.')

        RecordUtils(discordClient)
        FileUtils(discordClient)
    })

    discordClient.connect()
}
