const { EmbedBuilder } = require('discord.js');
const AC = require("./audio_controller.js");

class GameController {
  constructor(maxSecs) {
    this.state = "idle"; // idle, playing
    this.rounds = 0; // Variable to keep track of the number of rounds
    this.songName = ""; // Variable to store the name of the song
    this.nameGuess = []; // Variable to store the users correct guess
    this.maxSecs = maxSecs;
    this.secs = maxSecs;
    this.hints = 0;
    this.channel = null;
    this.points = {};
    this.songNameMessage = null;
  }

  sendPoints(){
    const fields = Object.entries(this.points).map(([player, points]) => {
      return { name: player, value: points.toString() };
    });
    const embed = new EmbedBuilder()
    .setTitle('Points')
    .addFields(fields)
    .setColor('#0099ff');

  this.channel.send({ embeds: [embed] });
  }

  #createEmbed(content){
    return new EmbedBuilder()
        .setColor('#0099ff')
        .setDescription(content);
  }

  async #sendSongGuessMsg(){
    const tmp = "**" + this.nameGuess.join('** **') + "** | ***"+this.secs+ "***";
    if(this.songNameMessage){
      await this.songNameMessage.edit({embeds: [this.#createEmbed(tmp)]});
    }else{
      this.songNameMessage = await this.channel.send({embeds: [this.#createEmbed(tmp)]});
    }
  }

  #hint(){
    if(this.maxSecs/2<this.secs || this.hint>=this.nameGuess.length/2)return
    if(Math.random()<((this.maxSecs - this.secs) / this.maxSecs)){
      let index = Math.floor(Math.random() * this.nameGuess.length);
      while(this.nameGuess[index]!=='_'){
        index = Math.floor(Math.random() * this.nameGuess.length);
      }
      this.nameGuess[index] = this.songName[index];
      this.hints++;
    }
    this.#sendSongGuessMsg();
  }

  audioInit() {
    return AC.getPlayer();
  }

  async playSong() {
    if (this.state !== "idle") return;
    this.rounds++;
    this.songNameMessage = null;
    this.hints = 0;

    this.channel.send({embeds: [this.#createEmbed("Starting round "+this.rounds)]});
    console.log(
      "Song number " +
        this.rounds +
        " out of " +
        AC.getLength() +
        " is playing!"
    );

    const audio = AC.getNextAudioFile();
    this.songName = audio.name;
    this.nameGuess = audio.name.split("").map(() => '_');
    await this.#sendSongGuessMsg();
    console.log("Song name: " + this.songName);
    AC.playSong(audio.path);
    this.state = "playing";


    this.timer();
  }

  // Method to check if the user's guess is correct
  checkGuess(message) {
    const { content, author } = message;
    if (this.state === "idle") return;
    if (content.trim().toLowerCase().replace(/[^a-z0-9]/gi, '') === this.songName.toLowerCase()) {
      if (!this.points[author.displayName]) {
        this.points[author.displayName] = 0;
      }
      this.points[author.displayName]+=this.secs;
      //message.channel.send(author.displayName + " got it right!");
      author.send("You got it right! You gain "+this.secs+" points!");
    }
    message.delete();
  }

  stopRound(){
    this.secs = this.maxSecs;
    AC.stopSong();
    this.state = "idle";
  }

  async timer() {
    if (this.state === "idle") return;
    await this.#sendSongGuessMsg();
    if (this.secs <= 0) {
      AC.stopSong();
      this.channel.send({embeds: [this.#createEmbed("Time's up! The game was ***" + this.songName + "***")]});
      this.stopRound();
    } else
      setTimeout(() => {
        this.secs--;
        this.#sendSongGuessMsg();
        this.timer();
      }, 1000);
  }
}

module.exports = GameController;
