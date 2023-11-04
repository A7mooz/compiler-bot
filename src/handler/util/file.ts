import { glob } from 'glob';
import { basename, dirname, extname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

export const _dirname = join(dirname(fileURLToPath(`${import.meta.url}`)), '../../');

export const allowedFilePattern = '.{c,m,}js';

export async function getAllFiles(dir: string) {
	return glob(`**/*${allowedFilePattern}`, { cwd: join(_dirname, dir), nodir: true });
}

export function fileName(path: string) {
	return basename(path.replace(extname(path), ''));
}

export function importFile<T>(...paths: string[]): Promise<T> {
	return import(`${pathToFileURL(join(_dirname, ...paths))}`);
}
