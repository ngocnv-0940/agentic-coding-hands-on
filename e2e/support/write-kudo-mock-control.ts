import { expect, type APIRequestContext } from '@playwright/test'
import { MOCK_PORT } from './mock-supabase-server'

/** Mock-only controls for the write path (never part of the app contract). Each reads or sets the mock state. */
export const MOCK = `http://localhost:${MOCK_PORT}`

export async function createdCount(request: APIRequestContext): Promise<number> {
  return ((await (await request.get(`${MOCK}/__e2e/kudos/created-count`)).json()) as { count: number }).count
}

export async function storedNames(request: APIRequestContext): Promise<string[]> {
  return ((await (await request.get(`${MOCK}/__e2e/storage/objects`)).json()) as { names: string[] }).names
}

export async function setCreateControl(request: APIRequestContext, control: { failNext?: boolean; delayMs?: number }) {
  expect((await request.post(`${MOCK}/__e2e/kudos/create-control`, { data: control })).ok(), 'create control').toBeTruthy()
}

export async function resetMock(request: APIRequestContext) {
  expect((await request.post(`${MOCK}/__e2e/kudos/reset-writes`)).ok(), 'mock reset').toBeTruthy()
}
