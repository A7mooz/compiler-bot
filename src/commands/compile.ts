import { Command, CommandType } from '#handler';
import { run, supportedLangs, languages } from '#util';
import { ApplicationCommandOptionType, codeBlock } from 'discord.js';

export default new Command({
	type: [CommandType.Slash],
	description: 'Compile and run code.',
	options: [
		{
			name: 'code',
			description: 'code',
			type: ApplicationCommandOptionType.String,
			required: true
		},
		{
			name: 'language',
			description: 'language',
			type: ApplicationCommandOptionType.String,
			choices: supportedLangs.map((v) => ({ name: v, value: v }))
		}
	],
	async execute({ interaction, options, send }) {
		const code = options.getString('code', true);
		const lang = options.getString('language') ?? 'ts';

		await interaction.deferReply({ ephemeral: true });

		const result = await run(interaction.id, code, lang as keyof typeof languages);

		if (typeof result === 'string') {
			await send(result);
			return;
		}

		await send(codeBlock(lang, result.all!));
	}
});
