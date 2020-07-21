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
			listQueuedSongs(message, serverQueue, args);
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
		description: video.description,
		thumbnail: video.image,
		durationInterval: null,
		length: video.seconds,
		currentTime: 0,
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
			durationLeft += (s.length - s.currentTime);
		});

		serverQueue.songs.push(song);

		const embed = new MessageEmbed()
			.setColor('#AF12B8')
			.setAuthor('Added to Queue', song.requesterAvatar)
			.setTitle(song.title)
			.setURL(song.url)
			.addFields(
				{ name: 'Duration', value: formatTime(song.length), inline: true },
				{ name: 'Estimated time until playing', value: formatTime(durationLeft), inline: true },
				{ name: 'Position in queue', value: serverQueue.songs.length - 1 },
			)
			.setThumbnail(song.thumbnail);

		return message.channel.send(embed);
	}
}

async function playSong(guild, song, songStart = '0s') {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}

	const dispatcher = serverQueue.connection
		.play(await ytdl(song.url, {
			filter: 'audioonly',
			highWaterMark: 1 << 25,
			begin: songStart,
		}), { type: 'opus' })
		.on('finish', () => {
			// if (!song.durationInterval) return
			clearInterval(song.durationInterval);
			serverQueue.songs.shift();
			playSong(guild, serverQueue.songs[0], queue);
		})
		.on('error', error => {
			clearInterval(song.durationInterval);
			console.error(error);
		});
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

	song.durationInterval = setInterval(() => {
		if (song.currentTime >= song.length) {
			clearInterval(song.durationInterval);
		}
		else {
			song.currentTime += 1;
		}
	}, 1000);

	const embed = new MessageEmbed()
		.setColor('#FF0000')
		.setAuthor('Now Playing', song.requesterAvatar)
		.setTitle(song.title)
		.setURL(song.url)
		.addFields(
			{ name: 'Duration', value: formatTime(song.length), inline: true },
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
	if (!serverQueue || !serverQueue.connection) {
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

function listQueuedSongs(message, serverQueue, args = [ 1 ]) {
	if (serverQueue && serverQueue.songs) {
		const songsPerPage = 11;
		const pageIndex = parseInt(args[0]) || 1;
		const totalPages = Math.ceil(serverQueue.songs.length / songsPerPage);
		const pageSongStart = pageIndex * songsPerPage - songsPerPage;
		const pageSongEnd = pageIndex * songsPerPage;

		if (isNaN(pageIndex) || pageIndex <= 0 || pageIndex > totalPages) {
			return message.channel.send('Enter a valid page number');
		}

		let totalDuration = 0;

		serverQueue.songs.forEach(song => {
			totalDuration += song.length;
		});

		const durationString = formatTime(totalDuration);

		const embed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`Queue for ${serverQueue.voiceChannel.name}`)
			.addField('**Now Playing:**', formatSong(serverQueue.songs[0]))
			.setFooter(`Page ${pageIndex}/${totalPages} | Total duration: ${durationString}`);

		const pageSongs = serverQueue.songs.slice(pageSongStart, pageSongEnd);

		pageSongs.forEach((song, index) => {
			const songIndex = index + pageSongStart;
			if (songIndex === 0) return;
			embed.addField(songIndex % 10 === 1 ? '**Up Next:**' : '\u200B', `**${songIndex}.** ${formatSong(song, songIndex)}`);
		});

		message.channel.send(embed);
	}
}

function formatSong(song) {
	return `[${song.title}](${song.url}) \`${formatTime(song.length)}\` - Requested by: \`${song.requester}\``;
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
		const removedSong = serverQueue.songs.splice(index, 1)[0];
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
	const timeline = timelineASCII(song);

	const embed = new MessageEmbed()
		.setColor('#29B464')
		.setAuthor('Now Playing', song.requesterAvatar)
		.setTitle(song.title)
		.setURL(song.url)
		.setDescription(song.description)
		.addFields(
			{ name: 'Time', value: timeline, inline: true },
			{ name: 'Channel', value: `${song.author}`, inline: true },
		)
		.setFooter(`Requested by: ${song.requester}`, song.requesterAvatar)
		.setThumbnail(song.thumbnail);

	message.channel.send(embed);
}

function timelineASCII(song) {
	let timeline = '───────────────';
	const timeRatio = ~~(song.currentTime * timeline.length / song.length);
	timeline = timeline.substr(0, timeRatio) + '|' + timeline.substr(timeRatio + 1);
	return `${formatTime(song.currentTime)} ${timeline} ${formatTime(song.length)}`;
}

// eww
// function pauseSong(message, serverQueue) {
// 	const song = serverQueue.songs[0];
// 	clearInterval(song.durationInterval);
// 	serverQueue.connection.dispatcher.end();
// 	message.channel.send(`⏸ Paused`)
// }

// function unpause(message, serverQueue) {
// 	const song = serverQueue.songs[0];
// 	playSong(message.guild, song, formatTime(song.length - song.timeRemaining));
// 	song.durationInterval = setInterval(() => {
// 		if (song.timeRemaining <= 0) {
// 			clearInterval(song.durationInterval);
// 		}
// 		else {
// 			song.timeRemaining -= 1;
// 		}
// 	}, 1000);
// }