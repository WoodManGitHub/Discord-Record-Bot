const Mixer = require('../utils/mixer')
const Stream = require('stream')
const moment = require('moment-timezone')
const config = require('../config.json')
const AudioUtils = require('../utils/audio')

module.exports = connectToVoice

function connectToVoice(discordClient) {
    const voiceConfig = config.discord.voiceChannels

    voiceConfig.forEach(channel => {
        console.log(`[Discord Voice] Connecting to voice channel => ${channel.channelID} .`)

        discordClient.joinVoiceChannel(channel.channelID).catch(err => {
            console.log(err)
        }).then(connection => {
            console.log(`[Discord Voice] Connected to voice channel => ${channel.channelID} .`)

            const mixer = new Mixer(16, 2, 48000)
            const streams = connection.receive('pcm')
            const userMP3Buffer = []
            let users = {}

            connection.on('disconnect', err => {
                console.error(err)
                users = {}
            })

            discordClient.on('voiceChannelLeave', (member, oldChannel) => {
                if (users[member.id]) {
                    users[member.id].end()
                    delete users[userID]
                }
            })

            streams.on('data', (data, userID) => {
                if (userID == undefined || channel.record.ignoreUsers.includes(userID)) return
                if (!users[userID]) {
                    console.log(`[Discord Record] Add user ${userID} to record mixer ${channel.channelID} .`)
                    users[userID] = new Stream.PassThrough()
                    mixer.addSource(users[userID])
                    
                    AudioUtils.generatePCMtoMP3Stream(mixer).on('data', mp3Data => {
                        userMP3Buffer.push(mp3Data)
                        if (userMP3Buffer.length > 4096) userMP3Buffer.shift(userMP3Buffer.length - 4096)
                    })
                }
                users[userID].write(data)
            })

            if (channel.record.sendTo.type == 'telegram' && channel.record.sendTo.chatID) {
                let mp3File = []
    
                AudioUtils.generatePCMtoMP3Stream(mixer).on('data', data => {
                    mp3File.push(data)
                })
    
                setInterval(() => {
                    const mp3Start = moment().tz('Asia/Taipei').format('YYYY-MM-DD hh:mm:ss')
                    const mp3End = moment().tz('Asia/Taipei').format('YYYY-MM-DD hh:mm:ss')
                    const caption = `${mp3Start} -> ${mp3End} \n${moment().tz('Asia/Taipei').format('#YYYYMMDD #YYYY')}`
                    const fileName = `${mp3Start} to ${mp3End}.mp3`
                    const fileData = Buffer.concat(mp3File)

                    mp3File = []
                    global.telegram.sendAudio(channel.record.sendTo.chatID, fileData, fileName, caption)
                }, 20 * 1000)
            }
        })
    })
}
