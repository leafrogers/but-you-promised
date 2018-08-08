# But You Promised

[![CircleCI](https://circleci.com/gh/keirog/but-you-promised/tree/master.svg?style=svg)](https://circleci.com/gh/keirog/but-you-promised/tree/master)

Call a promise-returning-function n times or until it resolves, otherwise reject.

## Usage

```js
const butYouPromised = require('but-you-promised');

const randomlyRejectingPromise = () => {
	const randomlyReject = Math.random() < 0.7;
	
	attemptsSoFar++;

	console.log(`On attempt number ${attemptsSoFar}`);

	return Promise[randomlyReject ? 'reject' : 'resolve']();
};

let attemptsSoFar = 0;

const exponentialBackoff = ({ seedDelayInMs }) => {
	return attemptsSoFar => {
		const delayInMs = (attemptsSoFar * attemptsSoFar) * seedDelayInMs;

		console.log(`⏳ Delaying by ${delayInMs} ms…`);

		return delayInMs;
	};
};

butYouPromised(randomlyRejectingPromise, {
	backoffStrategy: exponentialBackoff({ // defaults to no delay, no backoff
		seedDelayInMs: 1000
	}),
	data: {
		parameter: 123
	},
	triesRemaining: 10 // default is 5
})
.then(() => console.log('It resolved, eventually'))
.catch(() => console.log('It failed after 10 attempts'));
```
