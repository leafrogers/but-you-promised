module.exports = {
	env: {
		browser: true,
		commonjs: true,
		es6: true,
	},
	extends: [
		'airbnb-base',
	],
	globals: {
		Atomics: 'readonly',
		SharedArrayBuffer: 'readonly',
	},
	parserOptions: {
		ecmaVersion: 2018,
	},
	rules: {
		'arrow-body-style': 0,
		'comma-dangle': ['error', 'never'],
		indent: ['error', 'tab'],
		'no-tabs': 0
	}
};
