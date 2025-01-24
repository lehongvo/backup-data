import * as crypto from "crypto";
import fetch from "node-fetch";
import { awsConfig } from "../config";
import CONSTANTS from "../constants/index";
import { SQSConfig } from "../interface/index";

const sqsConfig: SQSConfig = {
  method: "POST",
  service: "sqs",
  algorithm: "AWS4-HMAC-SHA256",
  host: `sqs.${awsConfig.AWS.REGION}.amazonaws.com`,
  headers: {
    target: "AmazonSQS.SendMessage",
    contentType: "application/x-amz-json-1.0"
  },
  credentials: {
    accessKey: awsConfig.AWS.CREDENTIALS.ACCESS_KEY_ID,
    secretKey: awsConfig.AWS.CREDENTIALS.SECRET_ACCESS_KEY,
    region: awsConfig.AWS.REGION
  }
};

/**
 * Sends a message to the SQS queue
 * @param {Record<string, unknown>} payload - The payload to send
 * @returns {Promise<any | undefined>} The response from the SQS queue
 */
export async function sendMessageToSQS(payload: Record<string, unknown>): Promise<any | undefined> {
  const now: Date = new Date();
  const year: number = now.getUTCFullYear();
  const month: string = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day: string = String(now.getUTCDate()).padStart(2, "0");
  const hours: string = String(now.getUTCHours()).padStart(2, "0");
  const minutes: string = String(now.getUTCMinutes()).padStart(2, "0");
  const seconds: string = String(now.getUTCSeconds()).padStart(2, "0");
  const amzDate: string = `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  const dateStamp: string = amzDate.slice(0, 8);

  const canonicalRequest: string = createCanonicalRequest(
    sqsConfig.method,
    sqsConfig.host,
    payload,
    amzDate
  );

  const stringToSign: string = createStringToSign(amzDate, dateStamp, canonicalRequest);

  const authorizationHeader: string = calculateAuthParam(dateStamp, stringToSign);

  const MAX_TRIES = +CONSTANTS.MAX_TRIES_BEFORE_RETRY;
  for (let idx = 0; idx < MAX_TRIES; idx++) {
    try {
      const res = await fetch(`https://${sqsConfig.host}`, {
        method: sqsConfig.method,
        headers: {
          "X-Amz-Date": amzDate,
          "X-Amz-Target": sqsConfig.headers.target,
          "Content-Type": sqsConfig.headers.contentType,
          Authorization: authorizationHeader,
        },
        body: JSON.stringify(payload),
      });
      return await res.json() as any;
    } catch (error) {
      console.error("Error sending message to SQS", {
        handler: "sendMessageToSQS",
        error: error instanceof Error ? error : new Error(String(error))
      });
      if (idx < MAX_TRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, +CONSTANTS.AWAIT_TIME_BEFORE_RETRY));
      }
    }
  }
}

/**
 * Creates the canonical request
 * @param {string} method - The method to use
 * @param {string} host - The host to use
 * @param {Record<string, unknown>} payload - The payload to send
 * @param {string} amzDate - The date to use
 * @returns {string} The canonical request
 */
function createCanonicalRequest(
  method: string,
  host: string,
  payload: Record<string, unknown>,
  amzDate: string
): string {
  const canonicalUri = "/";
  const canonicalQuerystring = "";
  const canonicalHeaders = `content-type:${sqsConfig.headers.contentType}\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-target:${sqsConfig.headers.target}\n`;
  const signedHeaders = "content-type;host;x-amz-date;x-amz-target";

  const payloadHash = crypto
    .createHash("SHA256")
    .update(JSON.stringify(payload))
    .digest("hex");

  return `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
}

/**
 * Creates the string to sign
 * @param {string} amzDate - The date to use
 * @param {string} dateStamp - The date stamp to use
 * @param {string} canonicalRequest - The canonical request to use
 * @returns {string} The string to sign
 */
function createStringToSign(
  amzDate: string,
  dateStamp: string,
  canonicalRequest: string
): string {
  const credentialScope = `${dateStamp}/${sqsConfig.credentials.region}/${sqsConfig.service}/aws4_request`;
  const hashCanonicalRequest = crypto
    .createHash("sha256")
    .update(canonicalRequest)
    .digest("hex");

  return `${sqsConfig.algorithm}\n${amzDate}\n${credentialScope}\n${hashCanonicalRequest}`;
}

/**
 * Gets the signature key
 * @param {string} key - The key to use
 * @param {string} dateStamp - The date stamp to use
 * @param {string} regionName - The region name to use
 * @param {string} serviceName - The service name to use
 * @returns {Buffer} The signature key
 */
function getSignatureKey(
  key: string,
  dateStamp: string,
  regionName: string,
  serviceName: string
): Buffer {
  const kDate = crypto
    .createHmac("SHA256", `AWS4${key}`)
    .update(dateStamp)
    .digest();

  const kRegion = crypto
    .createHmac("SHA256", kDate)
    .update(regionName)
    .digest();

  const kService = crypto
    .createHmac("SHA256", kRegion)
    .update(serviceName)
    .digest();

  const kSigning = crypto
    .createHmac("SHA256", kService)
    .update("aws4_request")
    .digest();

  return kSigning;
}

/**
 * Calculates the authorization parameter
 * @param {string} dateStamp - The date stamp to use
 * @param {string} stringToSign - The string to sign to use
 * @returns {string} The authorization parameter
 */
function calculateAuthParam(dateStamp: string, stringToSign: string): string {
  const signingKey = getSignatureKey(sqsConfig.credentials.secretKey, dateStamp, sqsConfig.credentials.region, sqsConfig.service);
  const signature = crypto
    .createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  const signedHeaders = "content-type;host;x-amz-date;x-amz-target";
  const credentialScope = `${dateStamp}/${sqsConfig.credentials.region}/${sqsConfig.service}/aws4_request`;

  return `${sqsConfig.algorithm} Credential=${sqsConfig.credentials.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}