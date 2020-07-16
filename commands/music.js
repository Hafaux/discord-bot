const YouTube = require('discord-youtube-api');

const { googleAPIkey } = require('../config.json');

const youtube = new YouTube(googleAPIkey);

const ytdl = require('ytdl-core');

module.exports = {
	name: 'song',
	description: 'Play music from YouTube.',
	args: true,
	usage: 'play [song name] | skip | stop | queue',
	aliases: ['music', 'youtube'],
	async execute(message, args, queue) {
		const serverQueue = queue.get(message.guild.id);
		const command = args.shift();
		const video = await youtube.searchVideos(args.join(' '));
		switch (command) {
		case 'play':
			play(message, serverQueue, queue, video);
			break;
		case 'skip':
			skip(message, serverQueue);
			break;
		case 'stop':
			stop(message, serverQueue);
			break;
		case 'queue':
			listQueuedSongs(message, serverQueue);
			break;
		}
	},
};

async function play(message, serverQueue, queue, video) {
	const voiceChannel = message.member.voice.channel;

	if (!voiceChannel) {
		return message.channel.send(
			'You need to be in a voice channel to play music.',
		);
	}

	const permissions = voiceChannel.permissionsFor(message.client.user);
	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return message.channel.send(
			'I need the permissions to join and speak in your voice channel.',
		);
	}

	const songInfo = await ytdl.getInfo(video.id);
	const song = {
		title: songInfo.videoDetails.title,
		url: songInfo.videoDetails.video_url,
	};

	if (!serverQueue) {
		const queueContruct = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true,
		};

		queue.set(message.guild.id, queueContruct);

		queueContruct.songs.push(song);

		try {
			const connection = await voiceChannel.join();
			queueContruct.connection = connection;
			playSong(message.guild, queueContruct.songs[0], queue);
		}
		catch (err) {
			console.log(err);
			queue.delete(message.guild.id);
			return message.channel.send(err);
		}
	}
	else {
		serverQueue.songs.push(song);
		return message.channel.send(`**${song.title}** has been added to the queue.`);
	}
}

function playSong(guild, song, queue) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}

	const dispatcher = serverQueue.connection
		.play(ytdl(song.url))
		.on('finish', () => {
			serverQueue.songs.shift();
			playSong(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
	serverQueue.textChannel.send(`Playing: **${song.title}**`);
}

function skip(message, serverQueue) {
	if (!message.member.voice.channel) {
		return message.channel.send(
			'You have to be in a voice channel to stop the music!',
		);
	}
	if (!serverQueue) {return message.channel.send('There is no song that I could skip!');}
	serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
	if (!message.member.voice.channel) {
		return message.channel.send(
			'You have to be in a voice channel to stop the music!',
		);
	}
	serverQueue.songs = [];
	serverQueue.connection.dispatcher.end();
}

function listQueuedSongs(message, serverQueue) {
	if (serverQueue && serverQueue.songs) {
		console.log(serverQueue.songs);
		let data = '';

		serverQueue.songs.forEach((song, index) => {
			data += `${index + 1} - **${song.title}**\n`;
		});

		message.channel.send(data);
	}
}