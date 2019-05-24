const { expect } = require('chai')
	.use(require('sinon-chai'))
	.use(require('chai-as-promised'));
const sinon = require('sinon');
const butYouPromised = require('../main');


describe('But you promised', () => {
	const stubs = {};
	const noOp = () => {};
	const makeSureWeAlwaysGetToCatch = () => { throw new Error('Just in case'); };

	let clock;
	let timeRocket;

	beforeEach(() => {
		stubs.resolvingPromise = sinon.stub().resolves();
		stubs.rejectingPromise = sinon.stub().rejects(new Error('Hello I am an error message'));
		stubs.rejectingPromiseNoError = sinon.stub().rejects('Hello I am only a string');
		clock = sinon.useFakeTimers({
			toFake: ['setTimeout', 'Date']
		});

		// Make time go a thousand times faster 🚀
		timeRocket = setInterval(() => {
			clock.tick(1000);
		}, 1);
	});
	afterEach(() => {
		clock.restore();
		clearInterval(timeRocket);
		sinon.restore();
	});

	describe('First things first', () => {
		it('is a function', () => {
			expect(butYouPromised).to.be.a('function');
		});
	});

	describe('Always returns a wrapped function', () => {
		it('returns a function when called with the minimum parameters', () => {
			const wrappedFunction = butYouPromised(stubs.resolvingPromise);

			expect(wrappedFunction).to.be.a('function');
		});

		it('returns a function when called with custom parameters', () => {
			const wrappedFunction = butYouPromised(stubs.resolvingPromise, {
				backOffSeedDelayInMs: 15,
				giveUpAfterAttempt: 2
			});

			expect(wrappedFunction).to.be.a('function');
		});

		it('returns a function when called with no parameters', () => {
			const wrappedFunction = butYouPromised();

			expect(wrappedFunction).to.be.a('function');
		});

		it('returns a function when called with ridiculous parameters', () => {
			const wrappedFunction = butYouPromised(123, 'boop', '🍍');

			expect(wrappedFunction).to.be.a('function');
		});
	});

	describe('The wrapped function always returns a promise', () => {
		it('returns a promise when the function wrapper is created with the minimum parameters', () => {
			const wrappedFunction = butYouPromised(stubs.resolvingPromise);

			return expect(wrappedFunction()).to.be.a('promise');
		});

		it('returns a promise when the function wrapper is created with custom parameters', () => {
			const wrappedFunction = butYouPromised(stubs.resolvingPromise, {
				backOffSeedDelayInMs: 15,
				giveUpAfterAttempt: 2
			});

			return expect(wrappedFunction()).to.be.a('promise');
		});

		it('returns a promise when called with parameters', () => {
			const wrappedFunction = butYouPromised(stubs.resolvingPromise);

			return expect(wrappedFunction({ hello: 123 })).to.be.a('promise');
		});

		it('returns a promise when the function wrapper is created with no parameters', () => {
			const wrappedFunction = butYouPromised();

			return expect(wrappedFunction().catch(noOp)).to.be.a('promise');
		});

		it('returns a promise when the function wrapper is created with ridiculous parameters', () => {
			const wrappedFunction = butYouPromised(123, 'boop', '🍍');

			return expect(wrappedFunction().catch(noOp)).to.be.a('promise');
		});
	});

	describe('The wrapped function’s returning promise', () => {
		it('resolves if the passed-in function’s promise resolves', (done) => {
			const params = { one: 1, two: 2 };
			const wrappedFunction = butYouPromised(stubs.resolvingPromise);

			wrappedFunction(params)
				.then(done)
				.catch(done);
		});

		it('rejects if the passed-in function’s promise rejects', (done) => {
			const params = { one: 1, two: 2 };
			const wrappedFunction = butYouPromised(stubs.rejectingPromise, {
				giveUpAfterAttempt: 1
			});

			wrappedFunction(params)
				.then(() => done(new Error('This shouldn’t happen tbqh')))
				.catch(() => done());
		});
	});

	describe('Matching existing behaviour of the passed-in function', () => {
		it('calls the passed-in function', () => {
			const wrappedFunction = butYouPromised(stubs.resolvingPromise);

			return wrappedFunction(stubs.resolvingPromise).then(() => {
				expect(stubs.resolvingPromise.callCount).to.equal(1);
			});
		});

		it('calls the passed-in function with the parameters provided in the wrapped function call', () => {
			const wrappedFunction = butYouPromised(stubs.resolvingPromise);
			const params = ['hello', 123, { loveYou: true }];

			return wrappedFunction(...params)
				.then(() => {
					expect(stubs.resolvingPromise).to.have.been.calledWithExactly(...params);
				});
		});

		it('calls the passed-in function once if it resolves on the first attempt', () => {
			const wrappedFunction = butYouPromised(stubs.resolvingPromise);

			return wrappedFunction().then(() => {
				expect(stubs.resolvingPromise.callCount).to.equal(1);
			});
		});
	});

	describe('Default behaviour', () => {
		it('calls the passed-in function 5 times by default if it consistently returns a rejected promise', () => {
			const wrappedFunction = butYouPromised(stubs.rejectingPromise);

			return wrappedFunction()
				.then(makeSureWeAlwaysGetToCatch)
				.catch(() => {
					expect(stubs.rejectingPromise.callCount).to.equal(5);
				});
		});

		it('uses an exponentional back-off strategy by default', (done) => {
			const wrappedFunction = butYouPromised(stubs.rejectingPromise);
			const expectedDelays = [0, 1000, 5000, 14000, 30000];
			const lastIndex = expectedDelays.length - 1;

			expectedDelays.forEach((expectedTime, index) => {
				stubs.rejectingPromise.onCall(index).callsFake(() => {
					expect(Date.now()).to.be.at.least(expectedTime);

					if (index === lastIndex) {
						done();
					} else {
						expect(Date.now()).to.be.at.most(expectedDelays[index + 1]);
					}

					return Promise.reject();
				});
			});

			wrappedFunction().catch(noOp);
		});

		it('uses a back-off seed delay of 1000ms by default', (done) => {
			const wrappedFunction = butYouPromised(stubs.rejectingPromise);

			stubs.rejectingPromise.onCall(1).callsFake(() => {
				expect(Date.now()).to.be.at.least(1000);
				expect(Date.now()).to.be.at.most(2000);
				done();
				return Promise.resolve();
			});

			wrappedFunction().catch(noOp);
		});
	});

	describe('Overriding defaults', () => {
		it('allows number of maximum attempts to be overridden', () => {
			const wrappedFunction = butYouPromised(stubs.rejectingPromise, {
				giveUpAfterAttempt: 2
			});

			return wrappedFunction()
				.then(makeSureWeAlwaysGetToCatch)
				.catch(() => {
					expect(stubs.rejectingPromise.callCount).to.equal(2);
				});
		});

		it('allows a custom seed delay time for the back-off function', (done) => {
			const wrappedFunction = butYouPromised(stubs.rejectingPromise, {
				backOffSeedDelayInMs: 3000
			});

			stubs.rejectingPromise.onCall(1).callsFake(() => {
				expect(Date.now()).to.be.at.least(3000);
				expect(Date.now()).to.be.at.most(4000);

				done();

				return Promise.resolve();
			});

			wrappedFunction().catch(noOp);
		});

		it('allows a custom back-off function', (done) => {
			const wrappedFunction = butYouPromised(stubs.rejectingPromise, {
				backOffFunction: ({ seedDelayInMs }) => {
					// If you want to have the same back-off delay between each attempt
					return () => seedDelayInMs;
				}
			});

			const expectedDelays = [0, 1000, 2000, 3000, 4000];
			const lastIndex = expectedDelays.length - 1;

			expectedDelays.forEach((expectedTime, index) => {
				stubs.rejectingPromise.onCall(index).callsFake(() => {
					expect(Date.now()).to.be.at.least(expectedTime);

					if (index === lastIndex) {
						done();
					} else {
						expect(Date.now()).to.be.at.most(expectedDelays[index + 1]);
					}

					return Promise.reject();
				});
			});

			wrappedFunction().catch(noOp);
		});
	});

	describe('Behaviour of multiple attempts', () => {
		it('calls the passed-in function with the same parameters for each attempt', () => {
			const wrappedFunction = butYouPromised(stubs.rejectingPromise);
			const params = ['hello', 123, { loveYou: true }];

			return wrappedFunction(...params)
				.then(makeSureWeAlwaysGetToCatch)
				.catch(() => {
					expect(stubs.rejectingPromise).to.have.always.been.calledWithExactly(...params);
				});
		});
	});

	describe('When things are bad', () => {
		it('returns a rejected promise if the required parameter is not provided', (done) => {
			const wrappedFunction = butYouPromised();

			wrappedFunction()
				.then(() => done(new Error('This shouldn’t happen tbqh')))
				.catch(() => done());
		});

		it('returns a rejected promise with a parameter error if the required parameter is not passed', () => {
			const wrappedFunction = butYouPromised();

			return wrappedFunction()
				.then(makeSureWeAlwaysGetToCatch)
				.catch((err) => {
					expect(err.constructor.name).to.equal('ParameterError');
				});
		});

		it('returns a rejected promise with a parameter error if the required parameter is not a function', () => {
			const wrappedFunction = butYouPromised(123);

			return wrappedFunction()
				.then(makeSureWeAlwaysGetToCatch)
				.catch((err) => {
					expect(err.constructor.name).to.equal('ParameterError');
				});
		});

		it('calls the passed-in function the expected number of times if it rejects with a non-error type', () => {
			const wrappedFunction = butYouPromised(stubs.rejectingPromiseNoError);

			return wrappedFunction()
				.then(makeSureWeAlwaysGetToCatch)
				.catch(() => {
					expect(stubs.rejectingPromiseNoError.callCount).to.equal(5);
				});
		});
	});
});
