import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { getSqsEndpoint } from '@config/service-base-urls';

/**
 * Thin wrapper over the AWS SQS client, pointed at the local emulator (Floci in
 * the compose stack). Used by specs to seed a message directly onto a queue —
 * e.g. straight onto the DLQ, the same shortcut the gateway's DlqServiceIT uses.
 */
export class SqsClient {
  private readonly client: SQSClient;

  constructor(endpoint: string = getSqsEndpoint()) {
    this.client = new SQSClient({
      endpoint,
      region: process.env.AWS_REGION ?? 'eu-west-2',
      // The emulator accepts any credentials; these mirror the stack's dummy values.
      credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
    });
  }

  /** Send a message to a FIFO queue (group id + dedup id are required for FIFO). */
  async sendMessage(queueUrl: string, body: string, messageGroupId: string, messageDeduplicationId: string): Promise<void> {
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: body,
        MessageGroupId: messageGroupId,
        MessageDeduplicationId: messageDeduplicationId,
      }),
    );
  }

  destroy(): void {
    this.client.destroy();
  }
}
