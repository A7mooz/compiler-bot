import { type ClientOptions } from 'discord.js';

import type { InstanceOptions } from '#types/instance';

export const optionsClient: ClientOptions = {
	intents: ['Guilds', 'GuildMessages'],
	allowedMentions: {
		parse: []
	},
	failIfNotExists: false
};

export const optionsInstance: InstanceOptions = {
	ownerIds: ['479269670998900736'],
	testGuildIds: ['809360339211649035'],
	mongoURI: process.env.MONGO_URI,
	eventsDir: 'events',
	commandsDir: 'commands'
};
