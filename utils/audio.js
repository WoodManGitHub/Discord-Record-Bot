const Stream = require('stream')
const spawn = require('child_process').spawn

module.exports = {
    generatePCMtoMP3Stream(stream) {
        const outputStream = spawn(require('ffmpeg-static'), [
            '-f', 's16le', // 16-bit raw PCM
            '-ac', 2, // in channels
            '-ar', 48000, // in sample rate
            '-i', '-', // stdin
            '-c:a', 'libmp3lame', //  LAME MP3 encoder
            '-ac', 2, // out channels
            '-ar', 48000, // out sample rate
            '-ab', '320k', // bitrate
            '-f', 'mp3', // MP3 container
            '-' // stdout
        ])

        outputStream.stderr.on("data", data => {})
        stream.pipe(outputStream.stdin)
        
        return (outputStream.stdout)
    }
}
