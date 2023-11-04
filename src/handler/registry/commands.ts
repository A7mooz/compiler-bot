import { Command, CommandType, CustomInstance } from '#handler';
import { ApplicationCommandType, Routes, type ApplicationCommandData } from 'discord.js';
import { existsSync } from 'fs';
import { join } from 'path';
import { _dirname, fileName, getAllFiles, importFile } from '../util/file.js';

export async function initiateCommands(instance: CustomInstance) {
	await handleCommands(instance);
	registerCommands(instance);
}

export async function handleCommands(instance: CustomInstance) {
	const commandsDir = instance.options.commandsDir;
	if (!commandsDir) return;

	if (!existsSync(join(_dirname, commandsDir)))
		return instance.logger.warn(
			`The commands folder "${commandsDir}" (${join(_dirname, commandsDir)}) doesn't exist.`,
			'(the folder could be empty and not emitted in result)'
		);

	async function readFolder(dir: string) {
		const files = await getAllFiles(dir);

		for (const file of files) {
			const { default: command } = await importFile<{ default: unknown }>(dir, file);

			const name = fileName(file);

			if (!(command instanceof Command)) continue;

			if (!command.name)
				Object.defineProperty(command, 'name', {
					value: name,
					configurable: false,
					writable: false
				});

			command.instance = instance;

			if (instance.commands.has(command.name)) {
				process.emitWarning(`Detected douplicate of the command \`${command.name}\`.`, {
					detail: "You can't have mutiple commands with the same name."
				});
				continue;
			}

			instance.commands.set(command.name, command);
		}
	}

	return await readFolder(commandsDir);
}

export async function registerCommands(instance: CustomInstance) {
	const { client } = instance;

	const [guildCommands, globalCommands] = instance.commands.partition((cmd) => cmd.guilds.length);

	function format(type: ApplicationCommandType, command: Command<CommandType>): ApplicationCommandData {
		return {
			type,
			name: command.name,
			description: type === ApplicationCommandType.ChatInput ? command.description : '',
			defaultMemberPermissions: command.defaultMemberPermissions,
			dmPermission: command.dmPermission,
			options: type === ApplicationCommandType.ChatInput ? command.options : undefined
		};
	}

	const map = (cmd: Command<CommandType>) =>
		cmd.type.filter((t) => ApplicationCommandType[t]).flatMap((t) => format(t as unknown as ApplicationCommandType, cmd));

	const data = globalCommands.map(map).flat();

	const applicationId = client.application?.id ?? '';

	await client.rest.put(Routes.applicationCommands(applicationId), {
		body: client.options.jsonTransformer?.(data)
	});

	instance.logger.info(`Command Handler -> Synced ${data.length} global commands`);

	for (const [guildId, guild] of client.guilds.cache) {
		const commands = guildCommands.filter((cmd) => cmd.guilds.includes(guild.id));
		if (!commands.size) {
			if (instance.options.testGuildIds.includes(guild.id)) {
				await guild.commands.set([]);

				instance.logger.info(`${guild.name} -> Removed commands because it's a test guild (ID: ${guildId})`);
			}
			continue;
		}

		const data = commands.map(map).flat();

		instance.logger.info(`${guild.name} -> Synced ${data.length} commands (ID: ${guildId})`);

		await client.rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
			body: client.options.jsonTransformer?.(data)
		});
	}
}
