module.exports = {
	greet: async function(message) {
		if (message.author.bot) return;

		const words = message.content.split(/ +/).map(word => word.toLowerCase());
		const byeArray = ['bye friend', 'goodbye', 'adios amigo'];

		if (words.includes('bye')) {message.reply(byeArray[Math.floor(Math.random() * byeArray.length)]);}
		if (words.includes('pana')) message.react('728076776374403083');
	},
};