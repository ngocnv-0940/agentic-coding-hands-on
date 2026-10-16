import { createClient } from '@/lib/supabase/client'
import { IMAGE_MIME, sniffImageMime, type KudoImageMime } from './kudo-write-rules'

/**
 * Browser-only (uses the browser Supabase client with the user's own session): kudo images go straight from the
 * browser to Storage so their bytes never pass through a Server Action (1 MB body limit). Storage RLS decides who may
 * write; any failure, whatever its status (real Storage answers 400 with `statusCode: "403"`, the E2E mock 403), is a
 * failed upload. Only neutral names are returned; the RPC turns them into `kudo-images/<name>` rows.
 */

const BUCKET = 'kudo-images'

export class KudoImageUploadError extends Error {
  constructor(options?: { cause?: unknown }) {
    super('Kudo image upload failed', options)
    this.name = 'KudoImageUploadError'
  }
}

/** `<uuid v4>.<jpg|png|webp>`: neutral on purpose, it must not carry the uploader's id (anonymous kudos, FR-604). */
export function newKudoImageName(mime: KudoImageMime): string {
  return `${crypto.randomUUID()}.${IMAGE_MIME[mime]}`
}

/** Best effort: deletes the named uploads (e.g. after a failed send) and never throws. */
export async function removeKudoImages(names: readonly string[]): Promise<void> {
  if (names.length === 0) return
  try {
    await createClient().storage.from(BUCKET).remove([...names])
  } catch {
    // Leftovers are unreferenced, unguessable objects: nothing to surface to the user.
  }
}

/**
 * Uploads the files one after another (`upsert: false`) and returns their names in the same order. The type comes
 * from the magic bytes, never from `File.type`. On the first failure the uploads already made, and the failed one in
 * case it half-landed, are removed and a `KudoImageUploadError` is thrown.
 */
export async function uploadKudoImages(files: readonly File[]): Promise<string[]> {
  const storage = createClient().storage.from(BUCKET)
  const names: string[] = []
  let attempted: string | null = null
  try {
    for (const file of files) {
      const mime = sniffImageMime(new Uint8Array(await file.slice(0, 12).arrayBuffer()))
      if (!mime) throw new Error('not a jpeg, png or webp image')
      attempted = newKudoImageName(mime)
      const { error } = await storage.upload(attempted, file, { contentType: mime, upsert: false })
      if (error) throw error
      names.push(attempted)
      attempted = null
    }
    return names
  } catch (cause) {
    await removeKudoImages(attempted ? [...names, attempted] : names)
    throw new KudoImageUploadError({ cause })
  }
}
