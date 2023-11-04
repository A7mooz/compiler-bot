import textExecute from './text-execute.js';

import { Listener } from '#handler';

export default new Listener({
	event: 'messageUpdate',
	execute(oldMessage, newMessage, instance) {
		if (oldMessage.content === newMessage.content) return;

		if (newMessage.partial) return;

		if (!instance.options.ownerIds.includes(newMessage.author.id)) return;

		textExecute.execute(newMessage, instance);
	}
});
