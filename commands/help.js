const { prefix } = require('../config.json');

module.exports = {
	name: 'help',
	description: 'List all commands',
	aliases: ['commands', 'controls'],
	usage: '[command name]',
	execute(message, args) {
		const data = [];
		const { commands } = message.client;

		if (!args.length) {
			data.push('Commands: ');
			data.push(commands.map(command => command.name).join(', '));
			data.push(`\nSend \`${prefix}help [command name]\` to get more info on a specific command.`);

			return message.author.send(data, { split: true })
				.then(() => {
					if (message.channel.type == 'dm') return;
					message.reply('te envié un mensaje');
				})
				.catch(error => {
					console.error(`Couldn't send help DM to ${message.author.tag}.\n`, error);
					message.reply('No te pude enviar DM. ¿Tienes DM deshabilitados?');
				});
		}
		else {
			const name = args[0].toLowerCase();
			const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

			if (!command) {
				return message.reply('comando inválida');
			}

			data.push(`**Name:** ${command.name}`);

			if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
			if (command.description) data.push(`**Description:** ${command.description}`);
			if (command.usage) data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);

			message.channel.send(data, { split: true });
		}
	},
};