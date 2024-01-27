const {
  getNextAudioFile,
  getPlayer,
  playSong,
  stopSong,
  getLength,
} = require("./audio_controller.js");

class GameController {
  constructor() {
    this.state = "idle"; // Object to store the state of the game
    this.rounds = 0; // Variable to keep track of the number of rounds
    this.songName = ""; // Variable to store the name of the song
    this.secs = 25;
    this.channel = null;
    this.points = {};
  }

  audioInit() {
    return getPlayer();
  }

  // Method to start a new game
  playSong() {
    if (this.state !== "idle") return;
    this.rounds++;
    console.log(
      "Song number " + this.rounds + " out of " + getLength() + " is playing!"
    );
    const audio = getNextAudioFile();
    this.songName = audio.name;
    console.log("Song name: " + this.songName);
    playSong(audio.path);
    this.state = "playing";

    setTimeout(() => {
      stopSong();
    }, 15_000);

    this.timer();
  }

  // Method to check if the user's guess is correct
  checkGuess(message) {
    const { content, author } = message;
    if (this.state === "idle") return;
    if (content.toLowerCase() === this.songName.toLowerCase()) {
      if (!this.points[author.id]) {
        this.points[author.id] = 1;
      } else {
        this.points[author.id]++;
      }
      this.state = "idle";
      this.secs = 25;
      //message.delete();
      message.channel.send(message.author.username + " got it right!");
    }
  }

  timer() {
    if (this.state === "idle") return;
    if (this.secs === 10) {
      this.channel.send("**10 seconds left!**");
    } else if (this.secs < 10) {
      this.channel.send("**" + this.secs + "**");
    }
    this.secs--;
    if (this.secs <= 0) {
      this.secs = 25;
      this.state = "idle";
      this.channel.send("Time's up! The game was ***" + this.songName + "***");
      return;
    } else return new Promise(() => setTimeout(() => this.timer(), 1000));
  }
}

module.exports = GameController;
