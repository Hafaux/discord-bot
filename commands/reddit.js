const snoowrap = require('snoowrap');
const redditConfig = require('../reddit_config.json');

const reddit = new snoowrap({
	username: redditConfig.username,
	password: redditConfig.password,
	clientId: redditConfig.appId,
	clientSecret: redditConfig.appSecret,
	userAgent: redditConfig.userAgent,
});

module.exports = {
	name: 'reddit',
	description: 'Get ',
	args: true,
	usage: '[subreddit]',
	aliases: ['r'],
	execute(message, args) {
		reddit.getSubreddit(args[0])
			.getTop().then(res => {
				const submission = res[Math.floor(Math.random() * res.length)];
				// const embed = new MessageEmbed()
				// 	.setTitle(submission.title)
				// 	.setURL('https://reddit.com' + submission.permalink)
				// 	.setImage(submission.url)
				// 	.setColor('#FF4500');
				if (!submission) {
					return message.channel.send('Enter a valid subreddit.');
				}
				if (submission.over_18 && !message.channel.nsfw) {
					return message.channel.send('⛔ NSFW');
				}

				message.channel.send(submission.url);
			});
	},
};