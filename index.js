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
var game = new GameController();
const player = game.audioInit();
var connection, subscription;

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.MessageCreate, (message) => {
  if (message.author.bot) return;

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
      if (connection && connection._state.status !== "destroyed")
        connection.destroy();
      if (subscription) subscription.unsubscribe();
      break;
    
    case "points":
        const userScores = Object.entries(game.points);
        userScores.forEach(([userId, score]) => {
            const user = client.users.cache.get(userId);
            if (user) {
                message.channel.send(`${user.username}: ${score}`);
            }
        });
        break;

    default:
      if (!connection) return;
      game
        .checkGuess(message.content, message.author)
        .then((result) => {
          message.reply(result);
        })
        .catch((err) => {
          message.reply(err);
        });
      break;
  }
});
process.on("SIGINT", () => {
    if (connection && connection._state.status !== "destroyed") {
        connection.destroy();
    }
    if (subscription) {
        subscription.unsubscribe();
    }
    process.exit(0);
});

client.login(process.env.TOKEN);





