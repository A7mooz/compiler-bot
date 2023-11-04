import { Logger } from '@spark.ts/logger';
import { Client, Collection } from 'discord.js';
import mongoose from 'mongoose';

import { type Command, type CommandType } from './Command.js';
import { type Listener } from './Listener.js';
import { optionsClient, optionsInstance } from '../config.js';
import { handleListeners, initiateCommands } from '../registry/index.js';

import type { ResolvedInstanceOptions } from '#types/instance';

export class CustomInstance<Ready extends boolean = boolean> {
	#client: Client;
	readonly logger = new Logger();
	readonly options: ResolvedInstanceOptions;
	readonly listeners = new Collection<string, Listener<boolean>>();
	readonly commands = new Collection<string, Command<CommandType>>();

	constructor() {
		this.#client = new Client(optionsClient);

		const options = optionsInstance;
		this.options = {
			ownerIds: options.ownerIds ?? [],
			testGuildIds: options.testGuildIds ?? [],
			embedColor: options.embedColor ?? null,
			mongoURI: options.mongoURI,
			eventsDir: options.eventsDir,
			commandsDir: options.commandsDir
		};

		Object.defineProperty(this.options, 'mongoURI', {
			enumerable: false
		});

		this.options = Object.freeze(this.options);
	}

	isReady(): this is CustomInstance<true> {
		return this.#client.isReady();
	}

	get client(): Client<Ready> {
		return this.#client;
	}

	async start(token?: string) {
		await this.#client.login(token);

		this.logger.clear();

		this.logger.success(`${this.#client.user?.tag} connected to Discord with ${this.#client.ws.ping} ping!`);

		await this.mongo(this.options.mongoURI);

		await handleListeners(this, 'execute/listeners');

		await initiateCommands(this);

		return <CustomInstance<true>>this;
	}

	async mongo(uri?: string) {
		if (!uri) return mongoose;

		const result = await mongoose.connect(uri);

		this.logger.success('Connected to mongoDB');

		return result;
	}
}
