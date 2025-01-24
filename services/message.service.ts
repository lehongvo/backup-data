import { awsConfig } from '../config.ts';
import { sendMessageToSQS } from './sqs.service';

/**
 * Sends a message to the SQS queue
 * @param {string} messageEventType - The type of the message
 * @param {any} objectData - The data to send
 * @param {string} transactionHash - The transaction hash
 * @param {number} transactionIndex - The transaction index
 * @param {number} logIndex - The log index
 * @param {number} blockNumber - The block number
 */
export async function sendMessage(
  messageEventType: string,
  objectData: any,
  transactionHash: string,
  transactionIndex: number,
  logIndex: number,
  blockNumber: number
): Promise<void> {
  const message = JSON.stringify({
    type: messageEventType,
    msg: objectData,
    txHash: transactionHash,
    txIndex: transactionIndex,
    logIndex: logIndex,
    blockNumber,
  });

  try {
    const logContext = {
      service: 'MessageService',
      action: 'sendMessage',
      messageType: messageEventType,
      txHash: transactionHash,
      txIndex: transactionIndex,
      logIndex: logIndex,
      blockNumber: blockNumber,
    };

    console.log('┌─────────────── Message Service ───────────────┐');
    console.info('[INFO] Preparing to send message:', {
      ...logContext,
      timestamp: new Date().toISOString(),
    });

    const payload = {
      QueueUrl: awsConfig.AWS.SQS_QUEUE_URL,
      MessageBody: message,
      MessageGroupId: `${transactionHash}/${transactionIndex}/${logIndex}`,
      MessageDeduplicationId: `${transactionHash}/${transactionIndex}/${logIndex}`,
    };
    console.log(payload);

    await sendMessageToSQS(payload);

    console.info('[SUCCESS] Message sent successfully:', {
      ...logContext,
      timestamp: new Date().toISOString(),
      queueUrl: awsConfig.AWS.SQS_QUEUE_URL,
    });
    console.log('└────────────────────────────────────────────────┘');
  } catch (error) {
    console.log('┌─────────────── Message Service Error ───────────────┐');
    console.error('[ERROR] Failed to send message:', {
      service: 'MessageService',
      action: 'sendMessage',
      messageType: messageEventType,
      txHash: transactionHash,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : new Error(String(error)),
      timestamp: new Date().toISOString(),
    });
    console.log('└────────────────────────────────────────────────────┘');
  }
}
