const { Client, GatewayIntentBits, Partials, Events } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel],
});
require("dotenv").config();

const { joinVoiceChannel } = require("@discordjs/voice");

const GameController = require("./game_controller.js");
var game = new GameController(15);
const player = game.audioInit();
var connection, subscription;

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.MessageCreate, (message) => {
  if (message.author.bot) return;

  if (message.member.permissions.has("ADMINISTRATOR"))
    switch (message.content) {
      case "start":
        const channel = client.guilds.cache
          .get(message.guildId)
          .members.cache.get(message.author.id).voice.channel;

        if (!channel)
          return message.reply("You need to join a voice channel first!");
        game.channel = message.channel;
        connection = joinVoiceChannel({
          channelId: channel.id,
          guildId: message.guildId,
          adapterCreator: channel.guild.voiceAdapterCreator,
        });
        subscription = connection.subscribe(player);
        break;

      case "play":
        if (!connection) return;
        game.playSong();
        break;

      case "stop":
        if(game.state == "playing"){
          game.stopRound();
          return;
        } 
        if (connection && connection._state.status !== "destroyed")
          connection.destroy();
        if (subscription) subscription.unsubscribe();
        connection = null;
        break;

      case "points":
        game.sendPoints();
        break;

      default:
        if (game.state == "idle") return;
        game.checkGuess(message);

        break;
    }
});

client.login(process.env.TOKEN);
