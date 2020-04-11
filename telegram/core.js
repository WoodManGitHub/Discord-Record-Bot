const Telegram = require('node-telegram-bot-api')
const config = require('../config.json')
const FileUtils = require('./file')

module.exports = () => {
    const telegramClient = new Telegram(config.telegram.config.token, {polling: true})

    global.telegram = {}

    FileUtils(telegramClient)
}
