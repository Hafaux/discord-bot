module.exports = {
    name: 'ping',
    cooldown: 6,
    execute(message) {
        message.reply('pong');
    },
};