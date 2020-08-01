const { MessageAttachment } = require('discord.js');

module.exports = {
	name: 'avatar',
	description: 'Get a user\'s avatar.',
	usage: '<user> (gif)',
	aliases: ['pfp'],
	async execute(message, args) {
		const opts = args[0] === 'gif' ? { dynamic: true, size: 1024 } : { format: 'png', size: 1024 };
		const avatar = message.mentions.users.first() || message.author;
		const attachment = new MessageAttachment(avatar.avatarURL(opts));
		message.channel.send(attachment);
	}
};