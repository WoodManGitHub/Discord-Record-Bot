const config = require('../config.json')

module.exports = (discordClient) => {
    discordClient.on('messageCreate', async(msg) => {
        if (!msg.member) return

        const channelName = msg.channel.name
        const channelID = msg.channel.id
        const userName = (msg.member.nick) ? msg.member.nick : msg.member.user.username;
        const userID = msg.member.user.id;
        const messageContent = msg.content;

        // Log
        messageContent.split('\n').forEach(content => {
            console.log(`[Discord Log] [${userName}, ${userID}] => ${channelName} : ${content}`)
        })
        if (userID == discordClient.user) return
        var commands = []

        messageContent.split('\n').forEach(command => {
            if (config.discord.commandPrefix) {
                if (config.discord.commandPrefix && messageContent[0] == config.discord.commandPrefix) {
                    commands.push(command.substr(1));
                }
            } else {
                commands.push(command);
            }
        })

        commands.forEach(command => {
            switch (command.split(' ')[0]) {
                case 'ping':
                    sendMessage(discordClient, channelID, 'pong')
                    break;
                case 'download':
                    downloadUserMP3(discordClient, msg)
                    break;
                case 'memory':
                    sendMessage(discordClient, channelID, '```\n' + JSON.stringify(process.memoryUsage()) + '\n```')
                    break;
                default:
                    break;
            }
        })
    })
}

async function downloadUserMP3(client, msg) {
    const voiceChannelID = msg.member.voiceState.channelID;
    if (voiceChannelID == null) {
        sendMessage(client, msg.channel.id, 'You are not in any voice channel.')
        return;
    }

    if (!voiceChannelID in global.discord.audio.connections) {
        sendMessage(client, msg.channel.id, 'Bot not in your voice channel.')
        return;
    }

    const toDownloadUserID = msg.content.split(' ')[1];
    if (toDownloadUserID in global.discord.userMP3Buffers[voiceChannelID]) {
        global.discord.sendFile(msg.channel.id, Buffer.concat(global.discord.userMP3Buffers[voiceChannelID][toDownloadUserID]), toDownloadUserID + '.mp3');
    }
}

async function sendMessage(client, channelID, message) {
    client.createMessage(channelID, message);
}
