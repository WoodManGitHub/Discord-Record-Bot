const Mixer = require('../utils/mixer')
const Stream = require('stream')
const moment = require('moment-timezone')
const config = require('../config.json')
const AudioUtils = require('../utils/audio')

module.exports = (discordClient) => {
    const voiceConfig = config.discord.voiceChannels[0]

    global.discord.audio = {};
    global.discord.audio.connections = {}

    console.log(`[Discord Voice] Connecting to voice channel => ${voiceConfig.channelID} .`)

    const joinVoiceChannel = () => {
        discordClient.joinVoiceChannel(voiceConfig.channelID).catch(err => {
            console.log(err)
        }).then(connection => {
            console.log(`[Discord Voice] Connected to voice channel => ${voiceConfig.channelID} .`)
            console.log("[Discord Record] Start record in voice channel => " + channel.channelID + " .")

            connection.once('disconnect', err => {
                console.error(err)
                users = {}
                connection.removeAllListeners()
                streams.removeAllListeners()

                setTimeout(() => {
                    discordClient.leaveVoiceChannel(voiceConfig.channelID)
                    joinVoiceChannel()
                }, 5 * 1000);
            })

            global.discord.audio.connections[voiceConfig.channelID] = connection
            const mixer = new Mixer(16, 2, 48000)
            const streams = connection.receive('pcm')
            const userMP3Buffers = global.discord.userMP3Buffers[voiceConfig.channelID] = {};
            let users = {}
            let userPCMStream = {}

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

                    const userMP3Buffer = userMP3Buffers[userID] = []
                    const userMixerSplit = new Mixer(16, 2, 48000)

                    users[userID] = new Stream.PassThrough()
                    userPCMStream[userID] = new Stream.PassThrough()

                    mixer.addSource(users[userID])
                    userMixerSplit.addSource(userPCMStream[userID])

                    AudioUtils.generatePCMtoMP3Stream(userMixerSplit).on('data', mp3Data => {
                        userMP3Buffer.push(mp3Data)
                        if (userMP3Buffer.length > 4096) userMP3Buffer.shift(userMP3Buffer.length - 4096)
                    })
                }
                users[userID].write(data)
                userPCMStream[userID].write(data)
            })

            if (voiceConfig.record.sendTo.type == 'telegram' && voiceConfig.record.sendTo.chatID) {
                let mp3File = []

                AudioUtils.generatePCMtoMP3Stream(mixer).on('data', data => {
                    mp3File.push(data)
                    if (mp3File.length > 4096) mp3File.shift(mp3File.length - 4096)
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
