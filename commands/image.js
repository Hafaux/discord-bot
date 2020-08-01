const jimp = require('jimp');
const { MessageAttachment } = require('discord.js');

const kernels = {
	sharpen: [
		[ 0, 0, 0, 0, 0],
		[0, 0, -1, 0, 0],
		[0, -1, 5, -1, 0],
		[0, 0, -1, 0, 0],
		[0, 0, 0, 0, 0]
	],
	edges: [
		[-1, -1, -1],
		[-1, 8, -1],
		[-1, -1, -1]
	],
	emboss: [
		[-2, -1, 0],
		[-1, 1, 1],
		[0, 1, 2]
	]
};

module.exports = {
	name: 'image',
	description: 'Image effects',
	args: false,
	usage: 'fliph | flipv | gray/grayscale | emboss | sharpen | edges | scale [factor] | rotate',
	aliases: ['effect', 'img'],
	async execute(message, args) {
		let image;
		const messages = await message.channel.messages.fetch({ limit: 10 });
		let imageFound = false;
		messages.each(msg => {
			if (msg.attachments.first() && !imageFound) {
				image = msg.attachments.first().url;
				imageFound = true;
			}
		});

		if (!imageFound) {
			message.channel.send('No images found in the last 10 messages.');
			return;
		}

		const img = await jimp.read(image);

		switch(args[0]) {
		case 'fliph': img.flip(true, false); break;
		case 'flipv': img.flip(false, true); break;
		case 'gray': case 'grayscale': img.grayscale(); break;
		case 'emboss': img.convolute(kernels.emboss); break;
		case 'edges': img.convolute(kernels.edges); break;
		case 'sharpen': img.convolute(kernels.sharpen); break;
		case 'resize': case 'scale': img.scale(parseInt(args[1]) || 2); break;
		case 'rotate': img.rotate(parseInt(args[1]) || 90); break;
		case 'posterize': img.posterize(parseInt(args[1]) || 5); break;
		// case 'deepfry': case 'df': deepfry(img, parseInt(args[1] || 1)); break;
		}

		const buffer = await img.getBufferAsync('image/png');
		const attachement = new MessageAttachment(buffer);
		message.channel.send(attachement);
	}
};

// async function deepfry(img, iterations) {
// 	for (let i = 0; i < iterations; i++) {
// 		img.quality(1);
// 		const buffer = await img.getBufferAsync('image/png');
// 		img = await jimp.read(buffer);
// 	}
// 	// .contrast(0.5);
// 	return img;
// }