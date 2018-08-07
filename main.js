'use strict';

const defaults = {
	triesRemaining: 5
};

module.exports = (func, options) => {
	const settings = Object.assign({}, defaults, options);

	if (typeof func !== 'function') {
		return Promise.reject(new Error(`The first parameter should be a function, but it was type ${typeof func}`));
	}

	const attempt = () => {
		return func(settings.data)
			.catch(err => {
				if (settings.triesRemaining) {
					settings.triesRemaining--;
					return attempt();
				}

				return Promise.reject(err);
			});
	};

	return attempt();
};
