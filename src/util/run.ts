import { $ } from 'execa';
import { mkdir, rm, writeFile } from 'fs/promises';
import os from 'os';
import { basename, dirname, extname, join } from 'path';
import { languages } from './compile.js';

const supportedLangs = Object.keys(languages);

const TEMP = join(process.cwd(), 'tmp');

async function run(id: string, code: string, language: keyof typeof languages) {
	if (!supportedLangs.includes(language)) return 'This language is not supported';

	const main = await createMainFile(id, code, language);

	const lang = languages[language];

	if ('compile' in lang) await lang.compile(main);

	const result = await lang.run(main).catch((reason) => reason);

	await rm(TEMP, { recursive: true });

	return result;
}

function execCompiled(file = 'main') {
	file = join(dirname(file), basename(file).replace(extname(file), ''));

	switch (os.platform()) {
		case 'win32':
			return $({ all: true, shell: 'cmd.exe' })`${file}.exe`;
		default:
			return $({ all: true, shell: true })`${file}`;
	}
}

async function createMainFile(id: string, code: string, extention: string) {
	const tmp = join(TEMP, id, extention);

	await mkdir(tmp, { recursive: true });

	if (!extention.startsWith('.')) extention = '.' + extention;

	if (extention === '.js') extention = '.cjs';

	const path = join(tmp, 'main' + extention);

	await writeFile(path, code);

	return path;
}

export { execCompiled, run, supportedLangs };
