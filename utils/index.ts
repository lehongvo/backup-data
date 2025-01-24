import chalk from 'chalk';
import { EventArgs, MessageEventType, ProcessingContext, ProcessingStats, TokenMigratedDataType } from '../interface';
import { ethers } from 'ethers';
import CONSTANTS from '../constants';
import { sendMessage } from '../services/message.service';
import { awsConfig } from '../config';
import { SQS } from 'aws-sdk';

export const Logger = {
    info: (message: string, data?: any) => {
        console.log(chalk.blue('ℹ'), chalk.blue(message), data ? JSON.stringify(data, null, 2) : '');
    },
    success: (message: string, data?: any) => {
        console.log(chalk.green('✓'), chalk.green(message), data ? JSON.stringify(data, null, 2) : '');
    },
    error: (message: string, data?: any) => {
        console.log(chalk.red('✖'), chalk.red(message), data ? JSON.stringify(data, null, 2) : '');
    },
    warn: (message: string, data?: any) => {
        console.log(chalk.yellow('⚠'), chalk.yellow(message), data ? JSON.stringify(data, null, 2) : '');
    },
    progress: (current: number, total: number, message: string) => {
        const percentage = ((current / total) * 100).toFixed(2);
        console.log(chalk.cyan('→'), `${message}: ${percentage}% [${current}/${total}]`);
    }
};

export function calculateProcessingStats(context: ProcessingContext): ProcessingStats {
    const successRate = context.eventCount === 0 ? '0.00' :
        ((context.processedCount / context.eventCount) * 100).toFixed(2);
    const failureRate = context.eventCount === 0 ? '0.00' :
        ((context.failedCount / context.eventCount) * 100).toFixed(2);

    return {
        successRate: `${successRate}%`,
        failureRate: `${failureRate}%`,
        totalEvents: context.eventCount,
        successfulEvents: context.processedCount,
        failedEvents: context.failedCount
    };
}

export async function processEvent(
    event: ethers.Event,
    provider: ethers.providers.JsonRpcProvider
): Promise<void> {
    const {
        token,
        pairAddress,
        amountToken,
        amountETH
    } = event.args as unknown as EventArgs;

    const blockData = await provider.getBlock(event.blockNumber);
    const migrationData: TokenMigratedDataType = {
        tokenAddress: token.toUpperCase(),
        poolId: pairAddress.toUpperCase(),
        amountToken: Number(ethers.utils.formatEther(amountToken.toString())),
        amountETH: Number(ethers.utils.formatEther(amountETH.toString())),
        timestamp: Number(blockData.timestamp) * Number(CONSTANTS.AMOUNT_TO_MILLISECONDS),
        transactionHash: event.transactionHash,
    };

    await sendMessage(
        MessageEventType.TOKEN_MIGRATED,
        migrationData,
        event.transactionHash,
        event.transactionIndex,
        event.logIndex,
        event.blockNumber
    );
}

export enum AWSConfigError {
    REGION_INVALID = 'REGION_INVALID',
    CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
    CREDENTIALS_MISSING = 'CREDENTIALS_MISSING',
    QUEUE_URL_MISSING = 'QUEUE_URL_MISSING'
}

const VALID_AWS_REGIONS = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'ap-south-1', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
    'ap-southeast-1', 'ap-southeast-2',
    'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3',
    'sa-east-1'
];

export async function validateAwsConfig() {
    if (!awsConfig?.AWS) {
        throw {
            code: AWSConfigError.CONFIG_NOT_FOUND,
            message: 'AWS configuration not found'
        };
    }

    const { REGION, CREDENTIALS, SQS_QUEUE_URL } = awsConfig.AWS;

    if (!REGION) {
        throw {
            code: AWSConfigError.REGION_INVALID,
            message: 'AWS Region is required'
        };
    }

    if (!VALID_AWS_REGIONS.includes(REGION)) {
        throw {
            code: AWSConfigError.REGION_INVALID,
            message: `Invalid region in config. Please use a valid AWS region (e.g., us-east-1, ap-southeast-1)`
        };
    }

    if (!CREDENTIALS?.ACCESS_KEY_ID || !CREDENTIALS?.SECRET_ACCESS_KEY) {
        throw {
            code: AWSConfigError.CREDENTIALS_MISSING,
            message: 'AWS Credentials (ACCESS_KEY_ID and SECRET_ACCESS_KEY) are required'
        };
    }

    if (!SQS_QUEUE_URL) {
        throw {
            code: AWSConfigError.QUEUE_URL_MISSING,
            message: 'SQS Queue URL is required'
        };
    }

    try {
        const sqs = new SQS({
            region: REGION,
            credentials: {
                accessKeyId: CREDENTIALS.ACCESS_KEY_ID,
                secretAccessKey: CREDENTIALS.SECRET_ACCESS_KEY
            }
        });

        await sqs.getQueueAttributes({
            QueueUrl: SQS_QUEUE_URL,
            AttributeNames: ['QueueArn']
        }).promise();

    } catch (error) {
        throw {
            code: error.code || 'AWS_SERVICE_ERROR',
            message: error.message,
            originalError: error
        };
    }
}
