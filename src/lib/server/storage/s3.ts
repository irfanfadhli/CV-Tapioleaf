import { env } from '$env/dynamic/private';
import { MAX_IMAGE_SIZE, ALLOWED_MIME_TYPES } from '../product/validation';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const UPLOAD_DIR = path.resolve('static', 'uploads', 'products');

export async function uploadImage(filename: string, buffer: Buffer, mimeType: string): Promise<string | null> {
	try {
		if (!ALLOWED_MIME_TYPES.includes(mimeType)) return null;
		if (buffer.length > MAX_IMAGE_SIZE) return null;

		if (!existsSync(UPLOAD_DIR)) {
			await mkdir(UPLOAD_DIR, { recursive: true });
		}

		const ext = mimeType.split('/')[1] || 'jpg';
		const name = `${filename}.${ext}`;
		await writeFile(path.join(UPLOAD_DIR, name), buffer);

		return `/uploads/products/${name}`;
	} catch {
		return null;
	}
}

export async function deleteImage(url: string): Promise<void> {
	try {
		const filePath = path.join('static', url);
		const { unlink } = await import('node:fs/promises');
		await unlink(filePath);
	} catch {
		// silently fail
	}
}

export function generateImageFilename(prefix: string): string {
	return `${prefix}-${Date.now()}`;
}
