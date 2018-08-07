# But You Promised

[![CircleCI](https://circleci.com/gh/keirog/but-you-promised/tree/master.svg?style=svg)](https://circleci.com/gh/keirog/but-you-promised/tree/master)

Call a promise-returning-function n times or until it resolves, otherwise reject.

## Usage

```js
const butYouPromised = require('but-you-promised');

const randomlyRejectingPromise = () => {
	const randomlyReject = Math.random() < 0.5;
	return Promise[randomlyReject ? 'reject' : 'resolve']();
};

butYouPromised(randomlyRejectingPromise, {
	data: {
		parameter: 123
	},
	triesRemaining: 5
}) 
.then(() => console.log('It resolved, eventually'))
.catch(() => console.log('It failed after 5 attempts'));
```
