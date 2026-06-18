import { put, del } from '@vercel/blob';
import { writeFile, mkdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { env } from '$env/dynamic/private';
import { MAX_IMAGE_SIZE, ALLOWED_MIME_TYPES } from '../product/validation';

const isVercel = !!env.BLOB_READ_WRITE_TOKEN;
const LOCAL_DIR = path.resolve('static', 'uploads', 'products');

export async function uploadImage(filename: string, buffer: Buffer, mimeType: string): Promise<string | null> {
	try {
		if (!ALLOWED_MIME_TYPES.includes(mimeType)) return null;
		if (buffer.length > MAX_IMAGE_SIZE) return null;

		if (isVercel) {
			const ext = mimeType.split('/')[1] || 'jpg';
			const blob = await put(`products/${filename}.${ext}`, buffer, {
				access: 'public',
				contentType: mimeType,
				addRandomSuffix: false
			});
			return blob.url;
		}

		// Local fallback for development
		if (!existsSync(LOCAL_DIR)) await mkdir(LOCAL_DIR, { recursive: true });
		const ext = mimeType.split('/')[1] || 'jpg';
		const name = `${filename}.${ext}`;
		await writeFile(path.join(LOCAL_DIR, name), buffer);
		return `/uploads/products/${name}`;
	} catch {
		return null;
	}
}

export async function deleteImage(url: string): Promise<void> {
	try {
		if (isVercel) {
			await del(url);
		} else {
			const filePath = path.join('static', url);
			await unlink(filePath);
		}
	} catch {
		// silently fail
	}
}

export function generateImageFilename(prefix: string): string {
	return `${prefix}-${Date.now()}`;
}
