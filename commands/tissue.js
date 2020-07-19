const { registerFont, createCanvas, loadImage } = require('canvas');
const { MessageAttachment } = require('discord.js');

module.exports = {
	name: 'tissue',
	args: true,
	description: 'abla español?',
	usage: '[message]',
	async execute(message, args) {
		registerFont('./media/fonts/Schoolbell.ttf', { family: 'Comic Sans' });
		const canvas = createCanvas(300, 255);
		const ctx = canvas.getContext('2d');
		const background = await loadImage('./media/images/tissue.png');
		const tissueText = args.join(' ');

		ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
		ctx.font = applyText(canvas, tissueText);
		ctx.fillStyle = '#34313F';
		ctx.textAlign = 'center';
		ctx.fillText(tissueText, canvas.width / 1.7, canvas.height / 1.6, 240);

		const attachment = new MessageAttachment(canvas.toBuffer(), 'help.png');
		message.channel.send(attachment);
	},
};

function applyText(canvas, text) {
	const ctx = canvas.getContext('2d');
	let fontsize = 62;

	do {
		ctx.font = `${fontsize -= 4}px "Schoolbell"`;
	} while (ctx.measureText(text).width > canvas.width - 80 && fontsize > 14);

	return ctx.font;
}
