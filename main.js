const exponentialBackOff = ({ seedDelayInMs }) => {
	return attemptsSoFar => (attemptsSoFar * attemptsSoFar) * seedDelayInMs;
};

const defaults = {
	attemptsSoFar: 0,
	backOffFunction: exponentialBackOff,
	backOffSeedDelayInMs: 1000,
	giveUpAfterAttempt: 5,
	onFulfilled: result => result,
	onRejected: (err) => {
		throw err;
	}
};

class ParameterError extends Error {}

module.exports = (promiseReturningFunction, options) => {
	if (typeof promiseReturningFunction !== 'function') {
		return () => Promise.reject(new ParameterError(`The first parameter should be a function, but it was type ${typeof func}`));
	}

	return (...args) => {
		const settings = { ...defaults, ...options };
		const generateDelay = settings.backOffFunction({
			seedDelayInMs: settings.backOffSeedDelayInMs
		});

		const attempt = (...attemptArgs) => {
			settings.attemptsSoFar += 1;

			const handleSubsequentAttempts = resolve => setTimeout(
				() => resolve(attempt(...attemptArgs)),
				generateDelay(settings.attemptsSoFar)
			);

			const handleRejection = err => (
				(settings.attemptsSoFar < settings.giveUpAfterAttempt)
					? new Promise(handleSubsequentAttempts) : Promise.reject(err)
			);

			return promiseReturningFunction(...args)
				.then(settings.onFulfilled)
				.catch(settings.onRejected)
				.catch(handleRejection);
		};

		return attempt(...args);
	};
};
