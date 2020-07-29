const { MessageAttachment } = require('discord.js');

module.exports = {
	name: 'avatar',
	description: 'Get a user\'s avatar.',
	usage: '<user>',
	aliases: ['pfp'],
	async execute(message) {
		const avatar = message.mentions.users.first() || message.author;
		const attachment = new MessageAttachment(avatar.avatarURL({ dynamic: true, size: 1024 }));
		message.channel.send(attachment);
	},
};