import { $ } from 'execa';
import { execCompiled } from './run.js';
import { basename, dirname, extname, join } from 'path';

const languages = {
	py: {
		run(file: string) {
			return $({ all: true })`py ${file}`;
		}
	},
	js: {
		run(file: string) {
			return $({ all: true })`node ${file}`;
		}
	},
	ts: {
		compile(file: string) {
			return $`tsup ${file} --format cjs --sourcemap --outDir ${dirname(file)}`;
		},
		run(file: string) {
			return $({ all: true })`node --enable-source-maps ${join(dirname(file), basename(file).replace(/\.ts$/, '.cjs'))}`;
		}
	},
	c: {
		compile(file: string) {
			return $`gcc ${file} -o ${join(dirname(file), basename(file).replace(extname(file), ''))}`;
		},
		run: execCompiled
	},
	cpp: {
		compile(file: string) {
			return $`cpp ${file} -o ${join(dirname(file), basename(file).replace(extname(file), ''))}`;
		},
		run: execCompiled
	}
};

export { languages };
