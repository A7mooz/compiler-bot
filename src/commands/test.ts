import { Command, CommandType } from '#handler';

export default new Command({
	type: [CommandType.Slash, CommandType.Text],
	description: 'Test',
	cooldown: '10s',
	users: 'owners',
	ephemeral: true,
	async execute({ send }) {
		await send('Works');
	}
});
