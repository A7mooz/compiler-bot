import { CustomInstance, Listener } from '#handler';
import type { ExpectedListener } from '#types/listener.js';
import { type ClientEvents, type RestEvents } from 'discord.js';
import { existsSync } from 'fs';
import { extname, join, sep } from 'path';
import { _dirname, getAllFiles, importFile } from '../util/file.js';

export async function handleListeners(instance: CustomInstance, innerDir?: string) {
	const eventsDir = instance.options.eventsDir;
	const handlerDir = 'handler';

	async function readFolder(dir: string, cache?: boolean) {
		const files = await getAllFiles(dir);

		for (const file of files) {
			const { default: listener } = await importFile<{ default: ExpectedListener }>(dir, file);

			const name = join(dir, file).replace(extname(file), '').replace(`${eventsDir}${sep}`, '');

			if (typeof listener === 'function') {
				listener(instance);
			}

			if (!(listener instanceof Listener)) continue;

			if (!listener.name)
				Object.defineProperty(listener, 'name', {
					value: name,
					configurable: false,
					writable: false
				});

			if (cache) instance.listeners.set(name, listener);

			const { client } = instance;

			const fn = (...args: ClientEvents[keyof ClientEvents] | RestEvents[keyof RestEvents]) => listener.execute(...args, instance);

			if (listener.isRest()) {
				if (listener.once) client.rest.once(listener.event, fn);
				else client.rest.on(listener.event, fn);
			} else if (listener.isNotRest()) {
				if (listener.once) client.once(listener.event, fn);
				else client.on(listener.event, fn);
			}
		}
	}

	if (innerDir) await readFolder(join(handlerDir, innerDir), false);

	if (!eventsDir) return;
	if (!existsSync(join(_dirname, eventsDir)))
		return instance.logger.warn(
			`The events folder "${eventsDir}" (${join(_dirname, eventsDir)}) doesn't exist.`,
			'(the folder could be empty and not emitted in result)'
		);
	await readFolder(eventsDir);
}
