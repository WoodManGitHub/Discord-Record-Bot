const DiscordHandler = require('./discord/core')
const TelegramHandler = require('./telegram/core')

console.log('[Info] Starting...')

DiscordHandler()
TelegramHandler()

// GC
setInterval(() => {
    global.gc()
},30 * 1000)
