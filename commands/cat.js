const querystring = require('querystring');
const r2 = require('r2');
const { catAPIkey } = require('../config.json');

module.exports = {
	name: 'cat',
	description: 'mew!',
	usage: 'gif (optional)',
	async execute(message, args) {
		const headers = {
			'X-API-KEY': catAPIkey,
		};

		const query_params = {
			'mime_types': args[0] === 'gif' ? 'gif' : 'jpg,png',
			'limit' : 1,
		};

		const queryString = querystring.stringify(query_params);

		try {
			const _url = 'https://api.thecatapi.com/' + `v1/images/search?${queryString}`;
			const images = await r2.get(_url, { headers }).json;
			const image = images[0];
			// var breed = image.breeds[0];

			message.channel.send({ files: [ image.url ] });
		}
		catch (e) {
			console.log(e);
		}
	},

};