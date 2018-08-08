'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const butYouPromised = require('../main');

const sandbox = sinon.createSandbox();
const dataFixture = { test: 'hello' };
const optionsFixture = { data: dataFixture };

let resolveStub;
let rejectStub;
let rejectNoErrorStub;

describe('#butYouPromised', () => {
	beforeEach(() => {
		resolveStub = sandbox.stub().resolves();
		rejectStub = sandbox.stub().rejects();
		rejectNoErrorStub = sandbox.stub().returns(Promise.reject());
	});
	afterEach(sandbox.restore);

	it('is a function', () => {
		expect(butYouPromised).to.be.a('function');
	});

	it('returns a promise when minimum params are passed', done => {
		butYouPromised(resolveStub).then(done);
	});

	it('calls the passed-in function', () => {
		return butYouPromised(resolveStub).then(() => {
			expect(resolveStub.called).to.equal(true);
		});
	});

	it('passes an optional data param into the passed function', () => {
		return butYouPromised(resolveStub, optionsFixture).then(() => {
			expect(resolveStub.alwaysCalledWithExactly(dataFixture)).to.equal(true);
		});
	});

	it('returns a rejected promise if the required param is not passed', done => {
		butYouPromised().catch(() => done());
	});

	it('returns a rejected promise with an error if the required param is not passed', done => {
		butYouPromised().catch((err) => {
			try {
				expect(err instanceof Error).to.equal(true);
				done();
			} catch(err) {
				done(err);
			}
		});
	});

	it('returns a rejected promise if the required param is not a function', done => {
		butYouPromised(7).catch(() => done());
	});

	it('calls the required function once if it resolves on the first attempt', () => {
		return butYouPromised(resolveStub).then(() => {
			expect(resolveStub.calledOnce).to.equal(true);
		});
	});

	it('calls the required function the expected number of times if it consistently returns a rejected promise', done => {
		butYouPromised(rejectStub)
			.catch(() => {
				try{
					expect(rejectStub.callCount).to.equal(5);
					done();
				} catch(err) {
					done(err);
				}
			});
	});

	it('calls the required function the expected number of times if it rejects with a non-error type', done => {
		butYouPromised(rejectNoErrorStub).catch(() => {
			try {
				expect(rejectNoErrorStub.callCount).to.equal(5);
				done();
			} catch (err) {
				done(err);
			}
		});
	});

	it('calls the require function a custom number of times if it consistently rejects', done => {
		butYouPromised(rejectStub, { triesRemaining: 10 }).catch(() => {
			try {
				expect(rejectStub.callCount).to.equal(10);
				done();
			} catch(err) {
				done(err);
			}
		});
	});

	const exponentialDelay = ({ seedDelayInMs }) => {
		return attemptsSoFar => (attemptsSoFar * attemptsSoFar) * seedDelayInMs;
	};

	it('allows a backoff strategy to be used when retrying', function () {
		const startTime = Date.now();

		return butYouPromised(rejectStub, {
			backoffStrategy: exponentialDelay({ seedDelayInMs: 15 }),
			triesRemaining: 4
		}).catch(() => {
			const timeDelta = Date.now() - startTime;
			const expectedDelayFrom3Retries = 15 + 60 + 135;
			expect(timeDelta).to.be.at.least(expectedDelayFrom3Retries);
		});
	});
});
