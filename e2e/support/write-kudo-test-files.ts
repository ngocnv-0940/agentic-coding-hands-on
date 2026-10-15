/**
 * Upload fixtures for the Viết Kudo pickers, passed to setInputFiles({ name, mimeType, buffer }).
 * No binaries live in the repo: each file is its magic bytes plus padding. Browsers decode the thumbnail
 * lazily, so a stub body still renders as a thumbnail; the allowed-type check reads the magic bytes only.
 */
export interface PickedFile {
  name: string
  mimeType: string
  buffer: Buffer
}

const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
const FIVE_MIB = 5 * 1024 * 1024

const padded = (head: Buffer, size: number) => Buffer.concat([head, Buffer.alloc(Math.max(0, size - head.length))])

export const jpgFile = (name = 'anh-1.jpg'): PickedFile => ({
  name,
  mimeType: 'image/jpeg',
  buffer: padded(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), 1024),
})

export const pngFile = (name = 'anh-2.png'): PickedFile => ({ name, mimeType: 'image/png', buffer: PNG_1X1 })

export const webpFile = (name = 'anh-3.webp'): PickedFile => ({
  name,
  mimeType: 'image/webp',
  buffer: padded(Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x20, 0, 0, 0]), Buffer.from('WEBP')]), 1024),
})

export const pdfFile = (name = 'tai-lieu.pdf'): PickedFile => ({ name, mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%e2e\n') })

export const mp4File = (name = 'clip.mp4'): PickedFile => ({
  name,
  mimeType: 'video/mp4',
  buffer: padded(Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypmp42')]), 1024),
})

export const txtFile = (name = 'ghi-chu.txt'): PickedFile => ({ name, mimeType: 'text/plain', buffer: Buffer.from('e2e note') })

/** Just over the 5 MB cap, with a valid PNG header so only the size rule rejects it. */
export const oversizeImageFile = (name = 'qua-lon.png'): PickedFile => ({ name, mimeType: 'image/png', buffer: padded(PNG_1X1, FIVE_MIB + 1) })
