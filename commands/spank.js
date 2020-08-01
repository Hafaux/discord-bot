const { createCanvas, loadImage } = require('canvas');
const { MessageAttachment } = require('discord.js');

module.exports = {
	name: 'spank',
	description: 'spank spank spank',
	usage: '<user>',
	async execute(message) {
		const canvas = createCanvas(970, 933);
		const ctx = canvas.getContext('2d');
		const background = await loadImage('./media/images/spank.png');
		ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
		ctx.strokeStyle = '#74037b';
		ctx.strokeRect(0, 0, canvas.width, canvas.height);

		// Pick up the pen
		ctx.beginPath();
		// Start the arc to form a circle
		ctx.arc(810, 530, 120, 100, 0, Math.PI * 2, true);
		// Put the pen down
		ctx.closePath();
		// Clip off the region you drew on
		ctx.clip();
		const imgAttachment = message.attachments.first();
		const toSpank = message.mentions.users.first() ||
			(imgAttachment ? imgAttachment.url : message.author);

		let img;
		if (imgAttachment) img = await loadImage(toSpank);
		else img = await loadImage(toSpank.displayAvatarURL({ format: 'png' }));
		ctx.drawImage(img, 684, 396, 255, 255);
		const spankAttachment = new MessageAttachment(canvas.toBuffer(), 'help.png');
		message.channel.send(spankAttachment);
	},
};