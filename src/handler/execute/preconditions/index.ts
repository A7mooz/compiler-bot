import { type Interaction, InteractionType, Message } from 'discord.js';

import botPermissions from './bot-permissions.js';
import cooldown from './cooldown.js';
import userPermissions from './user-permissions.js';

import { Command, CommandType } from '#handler';
import { type InteractionTypes } from '#types/command';

export type AnyCommand = Command<InteractionTypes> | Command<CommandType.Text>;

export default function conditions(ctx: Interaction | Message, command: AnyCommand) {
	const complain = cooldown(ctx, command) ?? userPermissions(ctx, command) ?? botPermissions(ctx, command);
	if (!complain) return true;

	if (complain === true) return false;

	if (ctx.type === InteractionType.ApplicationCommandAutocomplete) {
		return false;
	}

	if (ctx instanceof Message) {
		ctx.reply(complain).catch(command.instance.logger.error);
		return false;
	}

	let options = {};

	if (typeof complain == 'string')
		options = {
			content: complain
		};
	else options = complain;

	ctx.reply({
		ephemeral: true,
		...options
	}).catch(command.instance.logger.error);

	return false;
}
