const jimp = require('jimp');
const { MessageAttachment } = require('discord.js');

const kernels = {
	sharpen: [
		[ 0, 0, 0, 0, 0],
		[0, 0, -1, 0, 0],
		[0, -1, 5, -1, 0],
		[0, 0, -1, 0, 0],
		[0, 0, 0, 0, 0],
	],
	edges: [
		[0, 1, 0],
		[1, -4, 1],
		[0, 1, 0],
	],
	emboss: [
		[-2, -1, 0],
		[-1, 1, 1],
		[0, 1, 2],
	],
};

module.exports = {
	name: 'image',
	description: 'Image effects',
	args: false,
	usage: 'fliph | flipv | gray/grayscale | emboss | sharpen | edges | scale [factor]',
	aliases: ['effect', 'img'],
	async execute(message, args) {

		// let image = message.attachments.first().url;
		let image;
		const messages = await message.channel.messages.fetch({ limit: 10 });
		let imageFound = false;
		messages.each(msg => {
			if (msg.attachments.first() && !imageFound) {
				image = msg.attachments.first().url;
				imageFound = true;
			}
		});

		let img = await jimp.read(image);

		switch(args[0]) {
		case 'fliph': img = img.flip(true, false); break;
		case 'flipv': img = img.flip(false, true); break;
		case 'gray': case 'grayscale': img = img.grayscale(); break;
		case 'emboss': img = img.convolute(kernels.emboss); break;
		case 'edges': img = img.convolute(kernels.edges); break;
		case 'sharpen': img = img.convolute(kernels.sharpen); break;
		case 'scale': img = img.scale(parseInt(args[2]) || 2); break;
		case 'rotate': img = img.rotate(parseInt(args[2]) || 90); break;
		}

		const buffer = await img.getBufferAsync('image/png');
		const attachement = new MessageAttachment(buffer);
		message.channel.send(attachement);
	},
};

