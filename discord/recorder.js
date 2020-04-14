const Mixer = require('../utils/mixer')
const Stream = require('stream')
const moment = require('moment-timezone')
const config = require('../config.json')
const AudioUtils = require('../utils/audio')

module.exports = (discordClient) => {
    const voiceConfig = config.discord.voiceChannels[0]

    console.log(`[Discord Voice] Connecting to voice channel => ${voiceConfig.channelID} .`)

    const joinVoiceChannel = () => {
        discordClient.joinVoiceChannel(voiceConfig.channelID).catch(err => {
            console.log(err)
        }).then(connection => {
            console.log(`[Discord Voice] Connected to voice channel => ${voiceConfig.channelID} .`)

            const mixer = new Mixer(16, 2, 48000)
            const streams = connection.receive('pcm')
            const userMP3Buffer = []
            let users = {}

            connection.once('disconnect', err => {
                console.error(err)
                users = {}
                connection.removeAllListeners()
                streams.removeAllListeners()
                discordClient.removeAllListeners()

                setTimeout(() => {
                    discordClient.leaveVoiceChannel(voiceConfig.channelID)
                    joinVoiceChannel()
                }, 5000);
            })

            discordClient.on('voiceChannelSwitch', (member, newChannel, oldChannel) => {
                if (newChannel != voiceConfig.channelID) {
                    if (users[member.id]) {
                        users[member.id].end()
                        delete users[member.id]
                    }
                }
            })

            connection.on('userDisconnect', userID => {
                if (users[userID]) {
                    users[userID].end()
                    delete users[userID]
                }
            })

            streams.on('data', (data, userID) => {
                if (userID == undefined || voiceConfig.record.ignoreUsers.includes(userID)) return
                if (!users[userID]) {
                    console.log(`[Discord Record] Add user ${userID} to record mixer ${voiceConfig.channelID} .`)
                    users[userID] = new Stream.PassThrough()
                    mixer.addSource(users[userID])

                    AudioUtils.generatePCMtoMP3Stream(mixer).on('data', mp3Data => {
                        userMP3Buffer.push(mp3Data)
                        if (userMP3Buffer.length > 4096) userMP3Buffer.shift(userMP3Buffer.length - 4096)
                    })
                }
                users[userID].write(data)
            })

            if (voiceConfig.record.sendTo.type == 'telegram' && voiceConfig.record.sendTo.chatID) {
                let mp3File = []

                AudioUtils.generatePCMtoMP3Stream(mixer).on('data', data => {
                    mp3File.push(data)
                })

                const intervalId = setInterval(() => {
                    const mp3Start = moment().tz('Asia/Taipei').format('YYYY-MM-DD hh:mm:ss')
                    const mp3End = moment().tz('Asia/Taipei').format('YYYY-MM-DD hh:mm:ss')
                    const caption = `${mp3Start} -> ${mp3End} \n${moment().tz('Asia/Taipei').format('#YYYYMMDD #YYYY')}`
                    const fileName = `${mp3Start} to ${mp3End}.mp3`
                    const fileData = Buffer.concat(mp3File)

                    mp3File = []
                    global.telegram.sendAudio(voiceConfig.record.sendTo.chatID, fileData, fileName, caption)
                }, 20 * 1000)

                connection.once('disconnect', err => {
                    clearInterval(intervalId)
                })
            }
        })

    }

    joinVoiceChannel()
}
