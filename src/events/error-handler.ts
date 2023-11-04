import { CustomInstance } from '#handler';

export default (instance: CustomInstance) => {
	const handle = (...args: unknown[]) => instance.logger.error(...args);

	process.on('rejectionHandled', handle).on('unhandledRejection', handle).on('uncaughtException', handle);
};
