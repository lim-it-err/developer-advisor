import { expect, test } from '@playwright/test'

const WINE_TITLE = '와인 추천기의 뒤엉킨 책임 풀어내기'
const KTX_TITLE = '통일호가 살아 있는 예매 시스템에 KTX 넣기'
const PROJECT_TITLE = '공공자전거 시스템 — 맨땅에서'

test.beforeEach(async ({ page }) => {
  // The E2E suite intentionally exercises the keyless, backend-off prototype path.
  await page.route('http://localhost:8080/**', (route) => route.abort())
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test.afterEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear())
})

test('미션 완주: 홈에서 제출하고 샘플 리뷰의 핵심 섹션을 본다', async ({ page }) => {
  await page.getByRole('link', { name: new RegExp(WINE_TITLE) }).click()
  await expect(page.getByRole('heading', { name: WINE_TITLE })).toBeVisible()

  await page.getByRole('button', { name: '브리핑 읽었어요 → 미션 보기' }).click()
  await expect(page.getByRole('heading', { name: '상황' })).toBeVisible()
  await page.getByRole('button', { name: '제출', exact: true }).click()

  await page.getByPlaceholder('예: src/main/java/wine/WineRecommender.java').fill('src/main/java/wine/WineRecommender.java')
  await page.getByPlaceholder('IntelliJ에서 작성한 코드를 여기에 붙여넣으세요').fill('public class WineRecommender {}')
  await page.getByRole('button', { name: '제출하고 리뷰 받기' }).click()

  await expect(page.getByRole('heading', { name: '기록에 이름을 남깁니다' })).toBeVisible()
  await page.getByPlaceholder('예: 김부장').fill('Codex E2E')
  await page.getByRole('button', { name: '확인' }).click()

  await expect(page).toHaveURL(/\/missions\/s1-wine-01\/review$/)
  await expect(page.getByText('종합 점수')).toBeVisible()
  await expect(page.getByRole('heading', { name: '🕵️ 히든 케이스 공개' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /시나리오/ })).toBeVisible()
})

test('필터: 난이도와 검색을 조합하고 초기화한다', async ({ page }) => {
  const missionCards = page.locator('.mission-card')
  await expect(missionCards).toHaveCount(33)

  await page.getByRole('button', { name: 'Easy', exact: true }).click()
  const easyCount = await missionCards.count()
  expect(easyCount).toBeGreaterThan(0)
  expect(easyCount).toBeLessThan(33)

  await page.getByPlaceholder('제목·도메인으로 찾기').fill('와인')
  await expect(missionCards).toHaveCount(1)
  await expect(page.getByRole('link', { name: new RegExp(WINE_TITLE) })).toBeVisible()

  await page.getByRole('button', { name: '필터 초기화' }).click()
  await expect(missionCards).toHaveCount(33)
})

test('기획자 모드: 참석자는 보이지만 비공개 관심사는 DOM에 없다', async ({ page }) => {
  await page.getByRole('link', { name: new RegExp(KTX_TITLE) }).click()
  await expect(page.locator('.mode-btn')).toHaveCount(3)

  await page.getByRole('button', { name: '🤝 기획자 · 회의' }).click()
  await expect(page.getByRole('heading', { name: '참석자' })).toBeVisible()
  await expect(page.locator('.stakeholder')).toHaveCount(4)
  await expect(page.locator('body')).not.toContainText('수기 보정')
})

test('프로젝트 여정: 첫 제출이 두 번째 소미션을 해금한다', async ({ page }) => {
  await page.getByRole('link', { name: '프로젝트', exact: true }).click()
  await page.getByRole('link', { name: new RegExp(PROJECT_TITLE) }).click()

  const nodeCards = page.locator('.node-card')
  await expect(nodeCards).toHaveCount(6)
  await expect(page.getByRole('button', { name: /도메인 모델 — 이름을 먼저 짓는다/ })).toBeEnabled()
  await expect(page.getByRole('button', { name: /대여와 반납 — 규칙이 코드가 되는 순간/ })).toBeDisabled()

  await page.getByPlaceholder('예: src/main/java/wine/WineRecommender.java').fill('src/main/java/bike/Bike.java')
  await page.getByPlaceholder('IntelliJ에서 작성한 코드를 여기에 붙여넣으세요').fill('public record Bike(String id) {}')
  await page.getByRole('button', { name: '제출하고 리뷰 받기' }).click()
  await page.getByPlaceholder('예: 김부장').fill('Codex E2E')
  await page.getByRole('button', { name: '확인' }).click()

  await expect(page.getByRole('button', { name: /대여와 반납 — 규칙이 코드가 되는 순간/ })).toBeEnabled()
})

test('루틴: 출근길 체크가 홈 배너 카운트에 반영된다', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-08-03T08:00:00'))
  await page.getByRole('link', { name: '오늘의 훈련', exact: true }).click()

  await expect(page.locator('.slot')).toHaveCount(3)
  await expect(page.getByText('출근길 · ~11시')).toBeVisible()
  await page.getByRole('button', { name: '읽었어요 ✓' }).click()
  await expect(page.getByText('✓ 완료')).toBeVisible()

  await page.getByRole('link', { name: /Developer Advisor/ }).click()
  await expect(page.getByText('오늘의 훈련 1/3')).toBeVisible()
})
