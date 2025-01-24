import { ethers } from "ethers";
import { ProcessingContext } from "../interface/index";
import CONSTANTS from "../constants/index";
import { MAIN_CONTRACT_ABI } from "../constants/abi";
import dotenv from 'dotenv';
import { calculateProcessingStats, Logger, processEvent, validateAwsConfig } from "../utils/index";

dotenv.config();

/**
 * Scan token migrated events
 * @returns {Promise<void>}
 */
export async function scanTokenMigratedEvents(): Promise<void> {
    Logger.info('Token Migration Scanner Started', {
        startTime: new Date().toISOString()
    });

    try {
        await validateAwsConfig();
    } catch (error) {
        console.error(`Error [${error.code}]:`, error.message);
        return;
    }
    try {
        const provider = new ethers.providers.JsonRpcProvider(CONSTANTS.RPC_URL);
        const contract = new ethers.Contract(CONSTANTS.MAIN_CONTRACT_ADDRESS, MAIN_CONTRACT_ABI, provider);
        const currentBlock = await provider.getBlockNumber();
        let fromBlock = Number(CONSTANTS.START_BLOCK);

        Logger.info('Scanner Configuration', {
            rpcUrl: CONSTANTS.RPC_URL,
            contractAddress: CONSTANTS.MAIN_CONTRACT_ADDRESS,
            startBlock: fromBlock,
            currentBlock: currentBlock,
            blockRange: Number(CONSTANTS.SCAN_WITH_SPACE_BLOCK)
        });

        while (fromBlock < currentBlock) {
            const context: ProcessingContext = {
                fromBlock,
                toBlock: 0,
                eventCount: 0,
                processedCount: 0,
                failedCount: 0,
            };

            try {
                context.toBlock = Math.min(
                    fromBlock + Number(CONSTANTS.SCAN_WITH_SPACE_BLOCK),
                    currentBlock
                );

                Logger.progress(fromBlock, currentBlock, 'Scanning blocks');

                const events = await contract.queryFilter('TokenMigrated', context.fromBlock, context.toBlock);
                context.eventCount = events.length;

                if (events.length > 0) {
                    Logger.info(`Found ${events.length} events in block range ${context.fromBlock}-${context.toBlock}`);
                }

                for (const event of events) {
                    try {
                        await processEvent(event, provider);
                        context.processedCount++;
                    } catch (eventError) {
                        context.failedCount++;
                        Logger.error('Event Processing Failed', {
                            txHash: event.transactionHash,
                            blockNumber: event.blockNumber,
                            error: eventError instanceof Error ? {
                                type: eventError.name,
                                message: eventError.message
                            } : String(eventError)
                        });
                    }
                }

                const stats = calculateProcessingStats(context);
                if (context.eventCount > 0) {
                    Logger.info('Block Range Summary', {
                        blockRange: `${context.fromBlock}-${context.toBlock}`,
                        processed: `${stats.successfulEvents}/${stats.totalEvents}`,
                        successRate: stats.successRate,
                        failureRate: stats.failureRate
                    });
                }

                fromBlock = context.toBlock + 1;
                await new Promise(resolve => setTimeout(resolve, Number(CONSTANTS.RETRY_DELAY)));
            } catch (rangeError) {
                Logger.error('Block Range Processing Failed', {
                    range: `${context.fromBlock}-${context.toBlock}`,
                    error: rangeError instanceof Error ? rangeError.message : String(rangeError)
                });

                await new Promise(resolve => setTimeout(resolve, Number(CONSTANTS.RETRY_DELAY) * 2));
            }
        }

        Logger.success('Scanner Completed', {
            finalBlock: currentBlock,
            endTime: new Date().toISOString()
        });
    } catch (error) {
        Logger.error('Scanner Failed', {
            error: error instanceof Error ? {
                type: error.name,
                message: error.message
            } : String(error),
            timestamp: new Date().toISOString()
        });
        throw error;
    }
}

/**
 * Main function
 * @returns {Promise<void>}
 */
if (require.main === module) {
    scanTokenMigratedEvents().catch((error) => {
        Logger.error('Fatal Error', {
            error: error instanceof Error ? {
                type: error.name,
                message: error.message
            } : String(error)
        });
        process.exit(1);
    });
}
