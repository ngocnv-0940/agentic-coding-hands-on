import { expect, test, type Page } from '@playwright/test'
import { openKudosBoard } from './support/kudos-board-session'
import * as k from './support/kudos-locators'
import { EXPECT, NAME } from './support/kudos-fixture-ids'

// Screen: /sun-kudos Spotlight board. Spec ids: TC FUNCTION 20, 28, 38, 39; FR-303..309, BR-011.
// Search is case- and diacritic-insensitive; an empty search clears the highlight with no error (TC 20's
// "required" message is contradicted by BR-011 and the spec, so the test asserts the absence of an error).
const EMPTY_SPOTLIGHT = 'Chưa có dữ liệu'

const linhNode = (page: Page) => k.spotlightNodes(page).filter({ hasText: NAME.linh })

test.describe('Sun* Kudos spotlight board', () => {
  // TC FUNCTION 28: loaded nodes are the distinct receivers; the header shows the kudo total
  test('TC FUNCTION 28: the spotlight renders one node per receiver and the kudo total', async ({ page }) => {
    await openKudosBoard(page)
    await expect(k.spotlightNodes(page)).toHaveCount(EXPECT.spotlightReceiverCount)
    await expect(k.spotlightTotal(page)).toHaveText(`${EXPECT.kudoTotal} KUDOS`)
  })

  // TC FUNCTION 39 / FR-305: hover shows the name and time; click opens the latest kudo of that person
  test('TC FUNCTION 39 / FR-305: hovering a node shows its tooltip and clicking opens the latest kudo', async ({ page }) => {
    await openKudosBoard(page)
    await expect(linhNode(page)).toBeVisible()
    await linhNode(page).hover()
    await expect(k.spotlightTooltip(page)).toContainText(NAME.linh)
    await expect(k.spotlightTooltip(page)).toHaveText(/·\s*\d{2}:\d{2} - \d{2}\/\d{2}\/\d{4}/)
    await linhNode(page).click()
    await expect(page).toHaveURL(new RegExp(`/sun-kudos/${EXPECT.spotlightNodeOfLinhLatestKudo}$`))
  })

  // TC FUNCTION 38 / FR-307: drag pans the canvas only while the Pan/Zoom mode is on
  test('TC FUNCTION 38 / FR-307: drag moves the canvas only while Pan/Zoom is on', async ({ page }) => {
    await openKudosBoard(page)
    // Start the drag at the canvas centre: the search control sits in the top-left corner and a drag that starts on a control is ignored (OWN_POINTER).
    const canvas = k.spotlightCanvas(page)
    await canvas.scrollIntoViewIfNeeded()
    const transformOf = () => k.spotlightPanZoom(page).evaluate((node) => getComputedStyle(node).transform)
    // matrix(a, ...) of the canvas transform: a is the zoom scale (1 = not zoomed)
    const scaleOf = () => k.spotlightPanZoom(page).evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).a)

    const off = await transformOf()
    await canvas.hover()
    await page.mouse.down()
    await page.mouse.move(120, 90, { steps: 4 })
    await page.mouse.up()
    expect(await transformOf(), 'drag with Pan/Zoom off changes nothing').toBe(off)
    const scrollBefore = await page.evaluate(() => window.scrollY)
    await canvas.hover()
    await page.mouse.wheel(0, -200)
    expect(await scaleOf(), 'wheel in with Pan/Zoom off leaves the scale at 1').toBe(1)
    await canvas.hover()
    await page.mouse.wheel(0, 200)
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { message: 'wheel with Pan/Zoom off scrolls the page' })
      .toBeGreaterThan(scrollBefore)

    await k.spotlightPanZoomToggle(page).click()
    const before = await transformOf()
    await canvas.hover()
    await page.mouse.down()
    await page.mouse.move(160, 120, { steps: 4 })
    await page.mouse.up()
    expect(await transformOf(), 'drag with Pan/Zoom on moves the canvas').not.toBe(before)
    expect(await scaleOf(), 'drag does not zoom').toBe(1)
    await canvas.hover()
    await page.mouse.wheel(0, -200)
    const zoomedIn = await scaleOf()
    expect(zoomedIn, 'wheel in with Pan/Zoom on raises the scale').toBeGreaterThan(1)
    await canvas.hover()
    await page.mouse.wheel(0, 400)
    expect(await scaleOf(), 'wheel out with Pan/Zoom on lowers the scale').toBeLessThan(zoomedIn)
  })

  // TC FUNCTION 38 / FR-307: releasing a drag on a node is not a click on that node
  test('TC FUNCTION 38 / FR-307: a drag that ends on a node does not navigate', async ({ page }) => {
    await openKudosBoard(page)
    await k.spotlightPanZoomToggle(page).click()
    const node = await linhNode(page).boundingBox()
    expect(node, 'linh node has a box').toBeTruthy()
    await page.mouse.move(node!.x - 80, node!.y - 40)
    await page.mouse.down()
    await page.mouse.move(node!.x + node!.width / 2, node!.y + node!.height / 2, { steps: 6 })
    await page.mouse.up()
    await expect(page).toHaveURL(/\/sun-kudos(\?.*)?$/)
  })

  // FR-311 / BR-011: search highlights matches case- and diacritic-insensitively; empty clears; 100 characters max
  test('FR-311 / BR-011: search highlights matching names, clears on empty, and caps input at 100 characters', async ({ page }) => {
    await openKudosBoard(page)
    const search = k.spotlightSearch(page)
    await expect(search).toHaveAttribute('maxlength', '100')
    await search.fill('nguyen')
    await expect(k.spotlightNodes(page).locator('[data-match="true"]')).toHaveCount(EXPECT.spotlightSearchMatches)
    await search.fill('')
    await expect(k.spotlightNodes(page).locator('[data-match="true"]')).toHaveCount(0)
    await expect(k.spotlightBlock(page).getByText(/bắt buộc|required/i)).toHaveCount(0)
    await search.fill('a'.repeat(101))
    expect((await search.inputValue()).length, 'input truncated to 100').toBe(100)
  })

  // TC FUNCTION 28: an empty board shows the empty message and zero kudos
  test('TC FUNCTION 28: with no kudos the spotlight shows the empty message and 0 KUDOS', async ({ page }) => {
    await openKudosBoard(page, 'kudos-empty')
    await expect(k.spotlightEmpty(page)).toContainText(EMPTY_SPOTLIGHT)
    await expect(k.spotlightTotal(page)).toHaveText('0 KUDOS')
  })
})
