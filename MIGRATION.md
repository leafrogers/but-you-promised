# Migration guide

## Upgrading from v1.x.x to v2.x.x

- Calling `butYouPromised` now returns a function wrapper for `yourFunction`
- No more passing your parameters in an awkward options.data object—use the returning function wrapper as you normally would use `yourFunction`
- optional overrides are passed in via an options object when wrapping `yourFunction`, where:
	-  `backoffStrategy` becomes `createBackOffFunction`
	- `triesRemaining` becomes `giveUpAfterAttempt`

```js
// v1 / Before
const yourParameterObj = { example: 123 };

butYouPromised(yourFunction, {
	backoffStrategy: ({ seedDelayInMs }) => {
		return attemptsSoFar => (attemptsSoFar * attemptsSoFar) * seedDelayInMs;
	},
	data: yourParameterObj,
	triesRemaining: 10
})
	.then(yourThenHandler)
	.catch(yourCatchHandler);
```
```js
// v2 / After
const yourParameterObj = { example: 123 };

const wrappedFunction = butYouPromised(yourFunction, {
	// If this is the back-off strategy you’re using, you can omit this now as it’s the default :-)
	createBackOffFunction: ({ seedDelayInMs }) => {
		return attemptsSoFar => (attemptsSoFar * attemptsSoFar) * seedDelayInMs;
	},
	giveUpAfterAttempt: 10
});

wrappedFunction(yourParameterObj)
	.then(yourThenHandler)
	.catch(yourCatchHandler);
```
