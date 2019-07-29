require('dotenv').config()
const AWS = require('aws-sdk');
const fs = require('fs');
const _ = require('lodash');

const s3 = new AWS.S3({
    region: 'eu-central-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

async function listAllObjectsFromS3Bucket(bucket, filter) {
    let isTruncated = true;
    let marker;
    let list = [];
    const regex = new RegExp(filter, 'ig');
    while (isTruncated) {
        let params = {Bucket: bucket};
        try {
            const response = await s3.listObjects(params).promise();
            response.Contents.forEach(item => {
                if (!filter) {
                    console.log(item.Key);
                    list.push(item);
                } else if(_.get(item, 'Key','').match(regex)){
                    console.log(item.Key);
                    list.push(item)
                }
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

async function clearBucket(bucket, filter) {
    let items = await listAllObjectsFromS3Bucket(bucket, filter)

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
    console.log(`Starting upload of file: '${fileName}' to S3 bucket: '${myBucket}'`);

    await new Promise(function (resolve, reject) {
            s3.createBucket({Bucket: myBucket}, function (err, data) {
                fs.readFile(fileName, function (err, data) {
                    if (err) reject(err);

                    let params = {
                        Key: fileName,
                        Body: data,
                        Bucket: myBucket
                    };
                    s3.upload(params, function (err, data) {
                        if (err) {
                            console.log('ERROR MSG: ', err);
                        } else {
                            console.log('Successfully uploaded file');
                        }
                        resolve()
                    });
                });
            });
        }
    )
}

async function run() {
    try {
        console.log('- List all files in an S3 Bucket')
        await listAllObjectsFromS3Bucket('lcloud-427-ts');

        console.log('\n- Upload a local file to a defined location in the bucket')
        await uploadLocalFile('lcloud-427-ts', 'sample.csv');

        console.log('\n- List an AWS buckets files that match a "filter" regex')
        await listAllObjectsFromS3Bucket('lcloud-427-ts', 'sample');

        console.log('\n- Delete all files matching a regex from a bucket');
        await clearBucket('lcloud-427-ts', 'sample.csv');
    } catch (err) {
        console.log("Failure: " + err)
    }
}

run()
