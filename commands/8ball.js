module.exports = {
	name: 'ask',
	args: true,
	description: 'Pana reaches into the future, to find the answers to your questions.',
	aliases: ['askpana'],
	usage: '[question]',
	execute(message) {
		const replies = ['wouldn\'t YOU like to know', 'no ablo ingles', 'si', 'no',
			'it eez what it eez', 'ask jyle', 'jyle would know', 'absolutely not',
			'not in a million years', 'you need help', 'hell no', 'help me how do i unmute',
			':3B? sure', 'es adios amigo', 'yes friend'];

		const reply = replies[Math.floor(Math.random() * replies.length)];
		message.channel.send(reply);
	},
};