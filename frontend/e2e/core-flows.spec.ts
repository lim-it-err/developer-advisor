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

test('루틴: 평일 노코드 슬롯과 주말 프로젝트 슬롯을 요일별로 보여준다', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.clock.setFixedTime(new Date('2026-08-03T08:00:00'))
  await page.getByRole('link', { name: '오늘의 훈련', exact: true }).click()

  await expect(page.locator('.slot')).toHaveCount(3)
  const weekdayLabels = [
    ['월', ['사건 파일 오늘 단서', '머지 or 반려', '카드 갈래 1장']],
    ['화', ['설계 리뷰 미션 읽기', '결말 예측 1건', '머지 or 반려']],
    ['수', ['독서 카드 + 갈래', '사건 파일 오늘 단서', '설명 시작 칩 고르기 (문장 완성은 선택)']],
    ['목', ['기획자 브리핑 읽기', '회의 질문 칩 3개 던지기', '카드 갈래 1장']],
    ['금', ['이번 주 리뷰 다시 읽기', '머지 or 반려', '설명 훈련 (선택·주중 유일 타이핑)']],
  ] as const

  for (const [day, labels] of weekdayLabels) {
    await page.getByRole('button', { name: day, exact: true }).click()
    await expect(page.locator('.slot-label')).toHaveText([...labels])
  }

  await page.getByRole('button', { name: '화', exact: true }).click()
  await page.locator('.slot').nth(1).getByRole('link').click()
  await expect(page).toHaveURL(/\?tab=mission#ending-prediction$/)
  await expect(page.locator('#ending-prediction')).toBeVisible()

  await page.goto('/routine')
  await page.getByRole('button', { name: '수', exact: true }).click()
  await page.locator('.slot').nth(2).getByRole('link').click()
  await expect(page).toHaveURL(/\?tab=explain#explain-starters$/)
  await expect(page.locator('#explain-starters')).toBeVisible()

  await page.goto('/routine')
  await page.getByRole('button', { name: '목', exact: true }).click()
  await page.locator('.slot').nth(1).getByRole('link').click()
  await expect(page).toHaveURL(/\?mode=plannerMeeting#meeting-room$/)
  await expect(page.locator('#meeting-room')).toBeVisible()

  await page.goto('/routine')
  await page.getByRole('button', { name: '월', exact: true }).click()
  await page.locator('.slot').first().getByRole('link').click()
  await expect(page).toHaveURL(/\/games\/case\//)
  await page.goto('/routine')
  await expect(page.getByText('✓ 완료')).toBeVisible()

  await page.getByRole('link', { name: /Developer Advisor/ }).click()
  await expect(page.getByText('오늘의 훈련 1/3')).toBeVisible()

  await page.getByRole('link', { name: '오늘의 훈련', exact: true }).click()
  await page.getByRole('button', { name: '수', exact: true }).click()
  const readingSlot = page.locator('.slot').first()
  await expect(readingSlot.getByText('독서 카드 + 갈래')).toBeVisible()
  const readingCardLink = readingSlot.getByRole('link')
  await expect(readingCardLink).toHaveAttribute('href', /^\/games\?card=read-/)
  const readingTitle = (await readingCardLink.textContent())?.trim()
  await readingCardLink.click()
  await expect(page).toHaveURL(/\/games\?card=read-/)
  await expect(page.locator('.insight-card.open').first()).toContainText(readingTitle ?? '')

  await page.goto('/routine')
  await page.getByRole('button', { name: '토', exact: true }).click()
  const cinemaSlot = page.locator('.slot').first()
  await expect(cinemaSlot.getByText('시사회 카드 보기')).toBeVisible()
  await expect(cinemaSlot.getByRole('link')).toHaveAttribute('href', /^\/games\?card=film-/)
  expect(errors).toEqual([])
})

test('머지 or 반려: 375px에서 5장 판정 후 세션 요약을 본다', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 375, height: 812 })

  await page.getByRole('link', { name: '미니게임', exact: true }).click()
  await page.getByRole('link', { name: /머지 or 반려/ }).click()
  await expect(page).toHaveURL(/\/routine\/swipe$/)
  await expect(page.getByText(/오늘의 판정 5장/)).toBeVisible()

  for (let index = 0; index < 5; index++) {
    await page.getByRole('button', { name: '✅ 머지' }).click()
    await page.getByRole('button', { name: '정확성', exact: true }).click()
    await expect(page.getByText(/^정답:/)).toBeVisible()
    await page.getByRole('button', { name: index === 4 ? '결과 보기' : '다음 카드 →' }).click()
  }

  await expect(page.getByRole('heading', { name: '5장 판정 완료' })).toBeVisible()
  await expect(page.getByText('맞은 판정')).toBeVisible()
  await expect(page.getByText('근거 적중')).toBeVisible()
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('advisor.learner.v1') ?? '{}'))
  expect(Object.values(persisted.swipeSessions ?? {})).toContain(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('카드 갈래: 첫 선택을 저장하고 반대 입장도 본 뒤 새로고침하면 복원한다', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 375, height: 812 })

  await page.getByRole('link', { name: '미니게임', exact: true }).click()
  const card = page.locator('[data-card-id="read-ggs-01"]')
  await card.getByRole('button', { name: /총, 균, 쇠/ }).click()
  await expect(card.getByText('여러분 프로젝트에서 가장 오래된 초기 선택 — 지금 그것은 무엇에 가깝습니까?'))
    .toBeVisible()

  await card.getByRole('button', { name: '🌾 축복 — 그 덕에 여기까지 왔다' }).click()
  await expect(card.getByText(/축복이라 느껴진다면/)).toBeVisible()
  const otherChoice = card.getByRole('button', { name: '⛓ 부채 — 매일 이자를 내고 있다' })
  await expect(otherChoice).toHaveClass(/muted/)
  await otherChoice.click()
  await expect(card.getByText(/부채라 부르는 순간/)).toBeVisible()

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('advisor.learner.v1') ?? '{}'))
  expect(persisted.cardForkChoices['read-ggs-01']).toBe('blessing')
  expect(persisted.seasonStats.gains.filter(
    (gain: { source: string }) => gain.source === 'card-fork:read-ggs-01',
  )).toHaveLength(1)

  await page.reload()
  const reloadedCard = page.locator('[data-card-id="read-ggs-01"]')
  await reloadedCard.getByRole('button', { name: /총, 균, 쇠/ }).click()
  await expect(reloadedCard.getByText(/축복이라 느껴진다면/)).toBeVisible()
  await expect(reloadedCard.getByRole('button', { name: '🌾 축복 — 그 덕에 여기까지 왔다' }))
    .toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('사건 파일: Day 1부터 몰아보고 근본 원인을 한 번 지목한다', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 375, height: 812 })

  await page.getByRole('link', { name: '미니게임', exact: true }).click()
  await page.getByRole('link', { name: /사라지는 적립금/ }).click()

  await expect(page).toHaveURL(/\/games\/case\/case-vanishing-points-01$/)
  await expect(page.getByRole('heading', { name: '사라지는 적립금' })).toBeVisible()
  await expect(page.getByText('Day 1 · 민원과 그래프')).toBeVisible()
  await expect(page.getByText('민원 41건 표본 정리:')).toBeVisible()
  await expect(page.getByRole('heading', { name: '이 사건의 근본 원인은 무엇입니까?' })).not.toBeVisible()

  await page.getByRole('button', { name: '몰아보기' }).click()
  await expect(page.getByText('Day 5 · 코드')).toBeVisible()
  await expect(page.getByText('민원 41건 표본 정리:')).not.toBeVisible()
  await page.getByText('Day 1 · 민원과 그래프').click()
  await expect(page.getByText('민원 41건 표본 정리:')).toBeVisible()
  await page.getByRole('button', {
    name: '증설 서버의 크론이 시간대 차이로 이중 실행됐고, 만료 차감에 멱등성이 없었다',
  }).click()

  await expect(page.getByText('적중', { exact: true })).toBeVisible()
  await expect(page.getByText(/방아쇠는 D-14의 증설입니다/)).toBeVisible()
  await expect(page.getByText(/수정은 세 줄이었습니다/)).toBeVisible()
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('advisor.learner.v1') ?? '{}'))
  expect(persisted.caseProgress['case-vanishing-points-01']).toMatchObject({
    openedDays: 5,
    verdict: 'cron-idempotency',
  })
  expect(persisted.seasonStats.gains.filter((gain: { source: string }) => gain.source.startsWith('case-')))
    .toHaveLength(2)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('시즌: 루틴 수동 체크가 교양 +1과 최근 적립 로그에 반영된다', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-08-04T08:00:00'))
  await page.evaluate(() => {
    localStorage.setItem('advisor.learner.v1', JSON.stringify({
      learner: { nickname: 'Codex E2E' },
      seasonStats: { seasonStart: '2026-08-03', gains: [] },
    }))
  })
  await page.reload()

  await page.getByRole('link', { name: '오늘의 훈련', exact: true }).click()
  await page.getByRole('button', { name: '읽었어요 ✓' }).click()
  await page.getByRole('link', { name: '시즌', exact: true }).click()

  await expect(page).toHaveURL(/\/season$/)
  await expect(page.locator('[data-stat="culture"] .stat-value')).toHaveText('1')
  await expect(page.getByText('루틴 수동 체크')).toBeVisible()
  await expect(page.getByText('+1', { exact: true })).toBeVisible()
})
