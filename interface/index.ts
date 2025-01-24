import { ethers } from "ethers";

/**
 * Event types for the message
 * @enum {string} MessageEventType
 * @property {string} TOKEN_CREATED - Token created event
 * @property {string} TOKEN_MIGRATED - Token migrated event
 * @property {string} TRADE - Trade event
 * @property {string} REFERRAL_ADDED - Referral added event
 * @property {string} REFERRAL_REMOVED - Referral removed event
 * @property {string} REFERRAL_UPDATED - Referral updated event
 * @property {string} REFERRAL_TYPE_UPDATED - Referral type updated event
 * @property {string} WITHDRAWAL - Withdrawal event
 */
export const MessageEventType = {
    TOKEN_CREATED: 'TokenCreated',
    TOKEN_MIGRATED: 'TokenMigrated',
    TRADE: 'Trade',
    REFERRAL_ADDED: 'ReferralAdded',
    REFERRAL_REMOVED: 'ReferralRemoved',
    REFERRAL_UPDATED: 'ReferralUpdated',
    REFERRAL_TYPE_UPDATED: 'ReferralTypeUpdated',
    WITHDRAWAL: 'Withdrawal'
};


/**
 * Interface for token migration data
 * @interface TokenMigratedDataType
 * @property {string} tokenAddress - The address of the token
 * @property {string} poolId - The ID of the pool
 * @property {number} amountToken - The amount of tokens migrated
 * @property {number} amountETH - The amount of ETH migrated
 * @property {number} timestamp - The timestamp of the migration
 * @property {string} transactionHash - The transaction hash of the migration
 */
export interface TokenMigratedDataType {
    tokenAddress: string;
    poolId: string;
    amountToken: number;
    amountETH: number;
    timestamp: number;
    transactionHash: string;
}


/**
 * Interface for event arguments
 * @interface EventArgs
 * @property {string} token - The token
 * @property {string} pairAddress - The pair address
 * @property {ethers.BigNumber} poolId - The pool ID
 * @property {ethers.BigNumber} amountToken - The amount of token
 * @property {ethers.BigNumber} amountETH - The amount of ETH
 */
export interface EventArgs {
    token: string;
    pairAddress: string;
    poolId: ethers.BigNumber;
    amountToken: ethers.BigNumber;
    amountETH: ethers.BigNumber;
}

/**
 * Interface for SQS configuration
 * @interface SQSConfig
 * @property {string} method - The HTTP method to use
 * @property {string} service - The service to use
 * @property {string} algorithm - The algorithm to use
 * @property {string} host - The host to use
 * @property {Object} headers - The headers to use
 * @property {Object} credentials - The credentials to use
 */
export interface SQSConfig {
    method: string;
    service: string;
    algorithm: string;
    host: string;
    headers: {
        target: string;
        contentType: string;
    };
    credentials: {
        accessKey: string;
        secretKey: string;
        region: string;
    };
}

/**
 * Interface for token migrated event
 * @interface TokenMigratedEvent
 * @property {number} blockNumber - The block number
 * @property {string} hash - The hash
 * @property {string} token - The token
 * @property {string} pairAddress - The pair address
 * @property {string} poolId - The pool value
 * @property {string} amountToken - The amount of token
 * @property {string} amountETH - The amount of ETH
 */
export interface TokenMigratedEvent {
    blockNumber: number;
    hash: string;
    token: string;
    pairAddress: string;
    poolId: string;
    amountToken: string;
    amountETH: string;
}

/**
 * Interface for processing context
 * @interface ProcessingContext
 * @property {number} fromBlock - The start block
 * @property {number} toBlock - The end block
 * @property {number} eventCount - The total number of events
 * @property {number} processedCount - The number of processed events
 * @property {number} failedCount - The number of failed events
 */
export interface ProcessingContext {
    fromBlock: number;
    toBlock: number;
    eventCount: number;
    processedCount: number;
    failedCount: number;
}

/**
 * Interface for processing stats
 * @interface ProcessingStats
 * @property {string} successRate - The success rate
 * @property {string} failureRate - The failure rate
 * @property {number} totalEvents - The total number of events
 * @property {number} successfulEvents - The number of successful events
 * @property {number} failedEvents - The number of failed events
 */
export interface ProcessingStats {
    successRate: string;
    failureRate: string;
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
}