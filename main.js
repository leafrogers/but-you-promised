'use strict';

const defaults = {
	backoffStrategy: () => 0,
	triesRemaining: 5
};

module.exports = (func, options) => {
	const settings = Object.assign({}, defaults, options);

	if (typeof func !== 'function') {
		return Promise.reject(new Error(`The first parameter should be a function, but it was type ${typeof func}`));
	}

	let attemptNum = 0;

	const attempt = () => {
		attemptNum++;
		settings.triesRemaining--;

		return func(settings.data)
			.catch(err => {
				if (settings.triesRemaining) {
					return new Promise(resolve => {
						setTimeout(
							() => resolve(attempt()),
							settings.backoffStrategy(attemptNum)
						);
					});
				};

				return Promise.reject(err);
			});
	};

	return attempt();
};
