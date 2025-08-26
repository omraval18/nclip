import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";


const accountId = process.env.R2_ACCOUNT_ID;

const endpoint = process.env.BUCKET_ENDPOINT!


export const r2 = new S3Client({
    credentials: {
        accessKeyId: process.env.BUCKET_ACCESS_KEY!,
        secretAccessKey: process.env.BUCKET_ACCESS_SECRET!,
    },
    endpoint,
    region: "us-east-1",
    forcePathStyle:false
});

export async function getSignedUrlForKey(
    s3: S3Client,
    bucket: string,
    key: string,
    expiresIn = 3600
): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    return await awsGetSignedUrl(s3, cmd, { expiresIn });
}
