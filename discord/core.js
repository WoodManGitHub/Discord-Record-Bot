const Discord = require('eris')
const config = require('../config.json')
const RecordUtils = require('./recorder')
const TextUtils = require('./text')
const FileUtils = require('./file')

module.exports = () => {
    const discordClient = new Discord(config.discord.config.token)

    global.discord = {}

    console.log('[Discord] Conneting...')

    discordClient.on('ready', () => {
        console.log('[Discord] Ready.')

        RecordUtils(discordClient)
        TextUtils(discordClient)
        FileUtils(discordClient)

        global.discord.userMP3Buffers = {};
    })

    discordClient.connect()
}
