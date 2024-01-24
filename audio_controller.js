const fs = require('fs');
const path = require('path');
const {createAudioResource,createAudioPlayer} = require("@discordjs/voice");
require('dotenv').config();
const folderPath =process.env.AUDIO_FOLDER;
const player =createAudioPlayer();

const audioFiles = fs.readdirSync(folderPath)
    .filter(file => file.endsWith('.mp3')) // Adjust the file extension if needed
    .map(file => ({
        name: file.split(".")[0],
        path: path.join(folderPath, file)
    }));

// Randomize the array
for (let i = audioFiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [audioFiles[i], audioFiles[j]] = [audioFiles[j], audioFiles[i]];
}

let currentIndex = 0;

function getNextAudioFile() {
    if (currentIndex >= audioFiles.length) {
        currentIndex = 0;
    }
    const audioFile = audioFiles[currentIndex];
    currentIndex++;
    return audioFile;
}

function playSong(path) {
    player.play(createAudioResource(path));
}

function stopSong() {
    player.stop();
}

function getPlayer(){
    return player;
}

function getLength(){
    return audioFiles.length;
}

module.exports = {
    getNextAudioFile,
    playSong,
    stopSong,
    getPlayer,
    getLength
};

console.log(audioFiles);
