const { MessageEmbed, Collection } = require('discord.js');

const ytdl = require('ytdl-core-discord');

const yts = require('yt-search');

const queue = new Collection();

module.exports = {
	name: 'song',
	description: 'Play music from YouTube.',
	args: true,
	usage: 'play/p [song name] | skip | stop | queue | remove/r | playing/np',
	aliases: ['s', 'music', 'youtube'],
	async execute(message, args) {
		const serverQueue = queue.get(message.guild.id);
		const command = args.shift();

		switch (command) {
		case 'p':
		case 'play':
			play(message, serverQueue, args.join(' '));
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
		case 'r':
		case 'remove':
			removeSong(message, serverQueue, args);
			break;
		case 'np':
		case 'playing':
			nowPlaying(message, serverQueue);
			break;
		}
	},
};

async function play(message, serverQueue, songQuery) {
	const voiceChannel = message.member.voice.channel;

	if (!voiceChannel) {
		return message.channel.send(
			'You need to be in a voice channel to play music.',
		);
	}

	if (!songQuery) {
		return message.channel.send(
			'what song tho',
		);
	}

	const permissions = voiceChannel.permissionsFor(message.client.user);
	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return message.channel.send(
			'Permission denied.',
		);
	}

	const queryResolve = await yts(songQuery);
	const video = queryResolve.videos[0];
	// const songInfo = await ytdl.getInfo(video.id);
	const song = {
		title: video.title,
		url: video.url,
		thumbnail: video.image,
		length: video.timestamp,
		seconds: video.seconds,
		author: video.author.name,
		requester: message.author.username,
		requesterAvatar: message.author.displayAvatarURL({ format: 'png' }),
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
		let durationLeft = 0;

		serverQueue.songs.forEach(s => {
			durationLeft += s.seconds;
		});

		serverQueue.songs.push(song);

		const embed = new MessageEmbed()
			.setColor('#AF12B8')
			.setAuthor('Added to Queue', song.requesterAvatar)
			.setTitle(song.title)
			.setURL(song.url)
			.addFields(
				{ name: 'Duration', value: song.length, inline: true },
				{ name: 'Estimated time until playing', value: formatTime(durationLeft), inline: true },
				{ name: 'Position in queue', value: serverQueue.songs.length - 1 },
			)
			.setThumbnail(song.thumbnail);

		return message.channel.send(embed);
	}
}

async function playSong(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}

	let durationInterval = null;
	const dispatcher = serverQueue.connection
		.play(await ytdl(song.url, {
			filter: 'audioonly',
			highWaterMark: 1 << 25,
		}), { type: 'opus' })
		.on('finish', () => {
			clearInterval(durationInterval);
			serverQueue.songs.shift();
			playSong(guild, serverQueue.songs[0], queue);
		})
		.on('error', error => {
			clearInterval(durationInterval);
			console.error(error);
		});
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

	durationInterval = setInterval(() => {
		if (song.seconds <= 0) {
			clearInterval(durationInterval);
		}
		else {
			song.seconds -= 1;
		}
	}, 1000);

	const embed = new MessageEmbed()
		.setColor('#FF0000')
		.setAuthor('Now Playing', song.requesterAvatar)
		.setTitle(song.title)
		.setURL(song.url)
		.addFields(
			{ name: 'Duration', value: song.length, inline: true },
			{ name: 'Channel', value: song.author, inline: true },
		)
		.setThumbnail(song.thumbnail);

	serverQueue.textChannel.send(embed);
}

function skip(message, serverQueue) {
	if (!message.member.voice.channel) {
		return message.channel.send(
			'You have to be in a voice channel to skip the current song.',
		);
	}
	if (!serverQueue) {
		return message.channel.send('No song to skip.');
	}
	serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
	if (!message.member.voice.channel) {
		return message.channel.send(
			'You have to be in a voice channel to stop the music.',
		);
	}
	serverQueue.songs = [];
	serverQueue.connection.dispatcher.end();
}

function listQueuedSongs(message, serverQueue) {
	if (serverQueue && serverQueue.songs) {

		let songsString = '';
		let totalDuration = 0;
		serverQueue.songs.forEach((song, index) => {
			totalDuration += song.seconds;
			if (index === 0 || index > 10) return;
			songsString += `**${index}.** [${song.title}](${song.url}) - Requested by: \`${song.requester}\`\n`;
		});

		const durationString = formatTime(totalDuration);

		const embed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`Queue for ${serverQueue.voiceChannel.name}`)
			.addField('**Now Playing:**', `[${serverQueue.songs[0].title}](${serverQueue.songs[0].url}) - Requested by: \`${serverQueue.songs[0].requester}\``)
			.setFooter(`Total duration: ${durationString}`);
		if (songsString) embed.addField('**Up Next:**', songsString);

		message.channel.send(embed);
	}
}

function formatTime(duration) {
	const hrs = ~~(duration / 3600);
	const mins = ~~((duration % 3600) / 60);
	const secs = ~~duration % 60;

	let ret = '';

	if (hrs > 0) {
		ret += '' + hrs + ':' + (mins < 10 ? '0' : '');
	}

	ret += '' + mins + ':' + (secs < 10 ? '0' : '');
	ret += '' + secs;
	return ret;
}

function removeSong(message, serverQueue, args) {
	if (!message.member.voice.channel) {
		return message.channel.send(
			'You have to be in a voice channel to remove a song from the queue.',
		);
	}

	if (!serverQueue || !serverQueue.songs) {
		return message.channel.send(
			'No songs to remove.',
		);
	}

	const index = parseInt(args);

	if (isNaN(index) || index <= 0 || index > serverQueue.songs.length) {
		return message.channel.send(
			'Enter a valid song number to remove.',
		);
	}
	else {
		const removedSong = serverQueue.songs.splice(index, 1);
		return message.channel.send(
			`Removed **${removedSong.title}**`,
		);
	}
}

function nowPlaying(message, serverQueue) {
	if (!serverQueue || !serverQueue.songs) {
		return message.channel.send(
			'No songs currently playing.',
		);
	}

	const song = serverQueue.songs[0];
	const embed = new MessageEmbed()
		.setColor('#29B464')
		.setAuthor('Now Playing', song.requesterAvatar)
		.setTitle(song.title)
		.setURL(song.url)
		.addFields(
			{ name: 'Time', value: `${formatTime(song.seconds)} / ${song.length}`, inline: true },
			{ name: 'Channel', value: `${song.author}`, inline: true },
		)
		.setFooter(`Requested by: ${song.requester}`, song.requesterAvatar)
		.setThumbnail(song.thumbnail);

	message.channel.send(embed);
}