require('dotenv').config()
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    region: 'eu-central-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

async function listAllObjectsFromS3Bucket(bucket, prefix) {
    let isTruncated = true;
    let marker;
    while(isTruncated) {
        let params = { Bucket: bucket };
        if (prefix) params.Prefix = prefix;
        if (marker) params.Marker = marker;
        try {
            const response = await s3.listObjects(params).promise();
            response.Contents.forEach(item => {
                console.log(item.Key);
            });
            isTruncated = response.IsTruncated;
            if (isTruncated) {
                marker = response.Contents.slice(-1)[0].Key;
            }
        } catch(error) {
            throw error;
        }
    }
}

listAllObjectsFromS3Bucket('lcloud-427-ts');
