import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { put, del } from '@vercel/blob';
import { writeFile, mkdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { env } from '$env/dynamic/private';
import { MAX_IMAGE_SIZE, ALLOWED_MIME_TYPES } from '../product/validation';

const LOCAL_DIR = path.resolve('static', 'uploads', 'products');

function getSupabaseS3() {
	if (!env.S3_ENDPOINT || !env.S3_ACCESS_KEY || !env.S3_SECRET_KEY || !env.S3_BUCKET) return null;
	return {
		client: new S3Client({
			endpoint: env.S3_ENDPOINT,
			region: env.S3_REGION || 'ap-southeast-1',
			credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
			forcePathStyle: true
		}),
		bucket: env.S3_BUCKET
	};
}

function getPublicUrl(key: string): string {
	const base = env.S3_ENDPOINT!.replace('/s3', '/object/public');
	return `${base}/${env.S3_BUCKET}/${key}`;
}

export async function uploadImage(filename: string, buffer: Buffer, mimeType: string): Promise<string | null> {
	try {
		if (!ALLOWED_MIME_TYPES.includes(mimeType)) return null;
		if (buffer.length > MAX_IMAGE_SIZE) return null;

		const ext = mimeType.split('/')[1] || 'jpg';
		const key = `products/${filename}.${ext}`;

		// Supabase S3
		const s3 = getSupabaseS3();
		if (s3) {
			await s3.client.send(new PutObjectCommand({
				Bucket: s3.bucket,
				Key: key,
				Body: buffer,
				ContentType: mimeType
			}));
			return getPublicUrl(key);
		}

		// Vercel Blob fallback
		if (env.BLOB_READ_WRITE_TOKEN) {
			const blob = await put(key, buffer, {
				access: 'public',
				contentType: mimeType,
				addRandomSuffix: false
			});
			return blob.url;
		}

		// Local fallback for development
		if (!existsSync(LOCAL_DIR)) await mkdir(LOCAL_DIR, { recursive: true });
		const name = `${filename}.${ext}`;
		await writeFile(path.join(LOCAL_DIR, name), buffer);
		return `/uploads/products/${name}`;
	} catch (e) {
		console.error('Upload error:', e);
		return null;
	}
}

export async function deleteImage(url: string): Promise<void> {
	try {
		const s3 = getSupabaseS3();
		if (s3) {
			const key = url.replace(getPublicUrl(''), '');
			if (key) {
				await s3.client.send(new DeleteObjectCommand({ Bucket: s3.bucket, Key: key }));
			}
			return;
		}

		if (env.BLOB_READ_WRITE_TOKEN) {
			await del(url);
			return;
		}

		const filePath = path.join('static', url);
		await unlink(filePath);
	} catch {
		// silently fail
	}
}

export function generateImageFilename(prefix: string): string {
	return `${prefix}-${Date.now()}`;
}
