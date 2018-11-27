import { BuyQuote } from '@0x/asset-buyer';
import * as _ from 'lodash';

import { AffiliateInfo, Network, OrderSource, ProviderState } from '../types';

import { EventProperties, heapUtil } from './heap';

let isDisabled = false;
export const disableAnalytics = (shouldDisableAnalytics: boolean) => {
    isDisabled = shouldDisableAnalytics;
};
export const evaluateIfEnabled = (fnCall: () => void) => {
    if (isDisabled) {
        return;
    }
    fnCall();
};

enum EventNames {
    INSTANT_OPENED = 'Instant - Opened',
    ACCOUNT_LOCKED = 'Account - Locked',
    ACCOUNT_READY = 'Account - Ready',
    ACCOUNT_UNLOCK_REQUESTED = 'Account - Unlock Requested',
    ACCOUNT_UNLOCK_DENIED = 'Account - Unlock Denied',
    ACCOUNT_ADDRESS_CHANGED = 'Account - Address Changed',
    BUY_NOT_ENOUGH_ETH = 'Buy - Not Enough Eth',
    BUY_STARTED = 'Buy - Started',
    BUY_SIGNATURE_DENIED = 'Buy - Signature Denied',
    BUY_SIMULATION_FAILED = 'Buy - Simulation Failed',
    BUY_TX_SUBMITTED = 'Buy - Tx Submitted',
    BUY_TX_SUCCEEDED = 'Buy - Tx Succeeded',
    BUY_TX_FAILED = 'Buy - Tx Failed',
}
const track = (eventName: EventNames, eventProperties: EventProperties = {}): void => {
    evaluateIfEnabled(() => {
        heapUtil.evaluateHeapCall(heap => heap.track(eventName, eventProperties));
    });
};
function trackingEventFnWithoutPayload(eventName: EventNames): () => void {
    return () => {
        track(eventName);
    };
}
// tslint:disable-next-line:no-unused-variable
function trackingEventFnWithPayload(eventName: EventNames): (eventProperties: EventProperties) => void {
    return (eventProperties: EventProperties) => {
        track(eventName, eventProperties);
    };
}

const buyQuoteEventProperties = (buyQuote: BuyQuote) => {
    const assetBuyAmount = buyQuote.assetBuyAmount.toString();
    const assetEthAmount = buyQuote.worstCaseQuoteInfo.assetEthAmount.toString();
    const feeEthAmount = buyQuote.worstCaseQuoteInfo.feeEthAmount.toString();
    const totalEthAmount = buyQuote.worstCaseQuoteInfo.totalEthAmount.toString();
    const feePercentage = !_.isUndefined(buyQuote.feePercentage) ? buyQuote.feePercentage.toString() : 0;
    const hasFeeOrders = !_.isEmpty(buyQuote.feeOrders) ? 'true' : 'false';
    return {
        assetBuyAmount,
        assetEthAmount,
        feeEthAmount,
        totalEthAmount,
        feePercentage,
        hasFeeOrders,
    };
};

export interface AnalyticsUserOptions {
    lastKnownEthAddress?: string;
    ethBalanceInUnitAmount?: string;
}
export interface AnalyticsEventOptions {
    embeddedHost?: string;
    embeddedUrl?: string;
    networkId?: number;
    providerName?: string;
    gitSha?: string;
    npmVersion?: string;
    orderSource?: string;
    affiliateAddress?: string;
    affiliateFeePercent?: number;
}

export const analytics = {
    addUserProperties: (properties: AnalyticsUserOptions): void => {
        evaluateIfEnabled(() => {
            heapUtil.evaluateHeapCall(heap => heap.addUserProperties(properties));
        });
    },
    addEventProperties: (properties: AnalyticsEventOptions): void => {
        evaluateIfEnabled(() => {
            heapUtil.evaluateHeapCall(heap => heap.addEventProperties(properties));
        });
    },
    generateEventProperties: (
        network: Network,
        orderSource: OrderSource,
        providerState: ProviderState,
        window: Window,
        affiliateInfo?: AffiliateInfo,
    ): AnalyticsEventOptions => {
        const affiliateAddress = affiliateInfo ? affiliateInfo.feeRecipient : 'none';
        const affiliateFeePercent = affiliateInfo ? parseFloat(affiliateInfo.feePercentage.toFixed(4)) : 0;
        const orderSourceName = typeof orderSource === 'string' ? orderSource : 'provided';
        return {
            embeddedHost: window.location.host,
            embeddedUrl: window.location.href,
            networkId: network,
            providerName: providerState.name,
            gitSha: process.env.GIT_SHA,
            npmVersion: process.env.NPM_PACKAGE_VERSION,
            orderSource: orderSourceName,
            affiliateAddress,
            affiliateFeePercent,
        };
    },
    trackInstantOpened: trackingEventFnWithoutPayload(EventNames.INSTANT_OPENED),
    trackAccountLocked: trackingEventFnWithoutPayload(EventNames.ACCOUNT_LOCKED),
    trackAccountReady: (address: string) => trackingEventFnWithPayload(EventNames.ACCOUNT_READY)({ address }),
    trackAccountUnlockRequested: trackingEventFnWithoutPayload(EventNames.ACCOUNT_UNLOCK_REQUESTED),
    trackAccountUnlockDenied: trackingEventFnWithoutPayload(EventNames.ACCOUNT_UNLOCK_DENIED),
    trackAccountAddressChanged: (address: string) =>
        trackingEventFnWithPayload(EventNames.ACCOUNT_ADDRESS_CHANGED)({ address }),
    trackBuyNotEnoughEth: (buyQuote: BuyQuote) =>
        trackingEventFnWithPayload(EventNames.BUY_NOT_ENOUGH_ETH)(buyQuoteEventProperties(buyQuote)),
    trackBuyStarted: (buyQuote: BuyQuote) =>
        trackingEventFnWithPayload(EventNames.BUY_STARTED)(buyQuoteEventProperties(buyQuote)),
    trackBuySignatureDenied: (buyQuote: BuyQuote) =>
        trackingEventFnWithPayload(EventNames.BUY_SIGNATURE_DENIED)(buyQuoteEventProperties(buyQuote)),
    trackBuySimulationFailed: (buyQuote: BuyQuote) =>
        trackingEventFnWithPayload(EventNames.BUY_SIMULATION_FAILED)(buyQuoteEventProperties(buyQuote)),
    trackBuyTxSubmitted: (buyQuote: BuyQuote, txHash: string, startTimeUnix: number, expectedEndTimeUnix: number) =>
        trackingEventFnWithPayload(EventNames.BUY_TX_SUBMITTED)({
            ...buyQuoteEventProperties(buyQuote),
            txHash,
            startTimeUnix,
            expectedEndTimeUnix,
        }),
    trackBuyTxSucceeded: (buyQuote: BuyQuote, txHash: string, startTimeUnix: number, expectedEndTimeUnix: number) =>
        trackingEventFnWithPayload(EventNames.BUY_TX_SUCCEEDED)({
            ...buyQuoteEventProperties(buyQuote),
            txHash,
            startTimeUnix,
            expectedEndTimeUnix,
            actualEndTimeUnix: new Date().getTime(),
        }),
    trackBuyTxFailed: (buyQuote: BuyQuote, txHash: string, startTimeUnix: number, expectedEndTimeUnix: number) =>
        trackingEventFnWithPayload(EventNames.BUY_TX_FAILED)({
            ...buyQuoteEventProperties(buyQuote),
            txHash,
            startTimeUnix,
            expectedEndTimeUnix,
            actualEndTimeUnix: new Date().getTime(),
        }),
};
