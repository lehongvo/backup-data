# AWS Configuration Guide

## AWS Config Setup

Before using the `workerBackupData` function, you need to configure your AWS information. Please create an `awsConfig.js` file with the following content:

```javascript
export const awsConfig = {
  AWS: {
    REGION: "YOUR_AWS_REGION",
    CREDENTIALS: {
      ACCESS_KEY_ID: "YOUR_ACCESS_KEY_ID",
      SECRET_ACCESS_KEY: "YOUR_SECRET_ACCESS_KEY",
    },
    SQS_QUEUE_URL: "YOUR_SQS_QUEUE_URL",
  },
};
```

## Run the script

```bash
yarn start
```

## Note

- If you want to run the script in a different region, you can change the `REGION` in the `awsConfig.js` file.
- If you want to run the script in a different queue, you can change the `SQS_QUEUE_URL` in the `awsConfig.js` file.
- If you want to run the script in a different access key and secret access key, you can change the `ACCESS_KEY_ID` and `SECRET_ACCESS_KEY` in the `awsConfig.js` file.
