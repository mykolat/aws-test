require('dotenv').config()
const AWS = require('aws-sdk');
const fs = require('fs');
const _ = require('lodash');

const s3 = new AWS.S3({
    region: 'eu-central-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

async function listAllObjectsFromS3Bucket(bucket,) {
    let isTruncated = true;
    let marker;
    let list = [];
    while (isTruncated) {
        let params = {Bucket: bucket};
        try {
            const response = await s3.listObjects(params).promise();
            response.Contents.forEach(item => {
                console.log(item.Key);
                list.push(item);
            });
            isTruncated = response.IsTruncated;
            if (isTruncated) {
                marker = response.Contents.slice(-1)[0].Key;
            }
        } catch (error) {
            throw error;
        }
    }
    return list;
}

async function listAllBuckets(filter) {
    const regex = new RegExp(filter, 'ig');
    s3.listBuckets({}, function (err, data) {
        let buckets = data.Buckets;
        let owners = data.Owner;
        for (let i = 0; i < buckets.length; i += 1) {
            let bucket = buckets[i];
            if (_.get(bucket, 'Name', '').match(regex))
                console.log(bucket.Name);
        }
        for (let i = 0; i < owners.length; i += 1) {
            console.log(owners[i].ID + " " + owners[i].DisplayName);
        }
    });
}

async function clearBucket(bucket, filter) {
    const regex = new RegExp(filter, 'ig');
    let items = await listAllObjectsFromS3Bucket(bucket)
    items = items.filter(el => _.get(el, 'Key', '').match(regex))

    for (let i = 0; i < items.length; i += 1) {
        let deleteParams = {Bucket: bucket, Key: items[i].Key};
        await deleteObject(deleteParams);
    }
}

async function deleteObject(deleteParams) {
    s3.deleteObject(deleteParams, function (err, data) {
        if (err) {
            console.log("delete err " + deleteParams.Key);
        } else {
            console.log("deleted " + deleteParams.Key);
        }
    });
}

async function uploadLocalFile(myBucket, fileName) {


    s3.createBucket({Bucket: myBucket}, function (err, data) {

        fs.readFile(fileName, function (err, data) {
            if (err) throw err;

            let params = {
                Key: fileName,
                Body: data,
                Bucket: myBucket
            };
            s3.upload(params, function (err, data) {
                if (err) {
                    console.log('ERROR MSG: ', err);
                } else {
                    console.log('Successfully uploaded data');
                }
            });
        });
    });
}

async function runner() {
    await uploadLocalFile('lcloud-427-ts', 'sample.csv');
    await listAllBuckets('pg');
    await listAllObjectsFromS3Bucket('lcloud-427-ts');
    await clearBucket('lcloud-427-ts', 'sample');
}

runner()
