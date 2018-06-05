import * as chai from 'chai';
import * as _ from 'lodash';

import { constants } from './constants';

const expect = chai.expect;

// throws if the given promise does not reject with one of two expected error
// messages.
export function expectRevertOrAlwaysFailingTransaction<T>(p: Promise<T>): PromiseLike<void> {
    return expect(p)
        .to.be.rejected()
        .then(e => {
            expect(e).to.satisfy(
                (err: Error) =>
                    _.includes(err.message, constants.REVERT) ||
                    _.includes(err.message, constants.ALWAYS_FAILING_TRANSACTION),
            );
        });
}

export function expectInsufficientFunds<T>(p: Promise<T>): PromiseLike<void> {
    return expect(p)
        .to.be.rejected()
        .then(e => {
            expect(e).to.satisfy(
                (err: Error) =>
                    _.includes(err.message, 'insufficient funds') ||
                    _.includes(err.message, "sender doesn't have enough funds"),
            );
        });
}

export function expectRevertOrContractCallFailed<T>(p: Promise<T>): PromiseLike<void> {
    return expect(p)
        .to.be.rejected()
        .then(e => {
            expect(e).to.satisfy(
                (err: Error) =>
                    _.includes(err.message, constants.REVERT) ||
                    _.includes(err.message, constants.CONTRACT_CALL_FAILED),
            );
        });
}
