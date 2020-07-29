module.exports = {
	name: 'ask',
	args: true,
	description: 'Pana reaches into the future, to find the answers to your questions.',
	aliases: ['askpana'],
	usage: '[question]',
	execute(message, args) {
		const replies = [
			'wouldn\'t YOU like to know', 'no ablo ingles', 'si', 'no',
			'it eez what it eez', 'ask jyle', 'jyle would know', 'absolutely not',
			'not in a million years', 'you need help', 'hell no', 'help me how do i unmute',
			':3B? sure', 'es adios amigo', 'yes friend', 'NOOOOOOOOOOOOOO', 'maybe, maybe not',
			'it\'s decidedly uncertain', 'ask that again and i will spank you', 'Signs point to jyle',
			'Yes. yes. yesyesyesyesyesyesyesyessyesyesyesyesy', 'You\'re too loud, no', 'very, very doubtful',
			'you may rely on it', 'my reply is', '🤣', 'jyle points to yes', 'jyle points to no', 'don\'t ask jyle',
			'ask a coherent question', 'better not tell you now', 'without a doubt - no', 'without a doubt',
			'the J-Man says yes', 'the J-Man says no', 'the J-Man is uncertain',
		];

		args = args.map(arg => arg.toLowerCase());
		const cat = args.includes('cat') || args.includes('cats') || args.includes('kitten') || args.includes('kittens') || args.includes('mew');

		const catReplies = [
			'I love cats!!!! Mew!!!', ':3c meow!', 'about time YOU posted some cat pics', ':3B', 'mew',
			'I never said I hated cats',
		];

		const reply = cat ? catReplies[Math.floor(Math.random() * catReplies.length)] : replies[Math.floor(Math.random() * replies.length)];
		message.channel.send(reply);
	},
};