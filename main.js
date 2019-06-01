const exponentialBackOff = ({ seedDelayInMs }) => {
	return attemptsSoFar => (attemptsSoFar * attemptsSoFar) * seedDelayInMs;
};

const defaults = {
	attemptsSoFar: 0,
	backOffFunction: exponentialBackOff,
	backOffSeedDelayInMs: 1000,
	giveUpAfterAttempt: 5,
	onFulfilled: () => {},
	onRejected: (err) => {
		throw err;
	}
};

class ParameterError extends Error {}

module.exports = (promiseReturningFunction, options) => {
	const settings = { ...defaults, ...options };
	const generateDelay = settings.backOffFunction({
		seedDelayInMs: settings.backOffSeedDelayInMs
	});

	if (typeof promiseReturningFunction !== 'function') {
		return () => Promise.reject(new ParameterError(`The first parameter should be a function, but it was type ${typeof func}`));
	}

	const attempt = (...args) => {
		settings.attemptsSoFar += 1;

		const handleSubsequentAttempts = resolve => setTimeout(
			() => resolve(attempt(...args)),
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

	return attempt;
};
