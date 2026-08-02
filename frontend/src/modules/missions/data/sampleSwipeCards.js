/**
 * 머지 or 반려 — 판정 카드 (Claude 전담 콘텐츠)
 * 스키마 (dev-005 동결 계약): { id, title, code, correct: 'merge'|'reject'|'question',
 *   reasonTokens, correctToken, explain }
 * 원칙: 문법 오류·노골적 NPE 금지 — 평범한 입력에선 멀쩡하고 경계·운영·프레임워크 의미에서 갈리는 코드만.
 */

const REASON_TOKENS = ['정확성', '계약', '운영', '가독성', '지금은 아님'];

const swipeCards = [
  {
    id: 'swipe-tx-self-01',
    title: '주문 저장에 트랜잭션을 걸었습니다',
    code: `@Service
public class OrderService {

    public void placeOrder(Order order) {
        validate(order);
        saveWithTx(order); // 같은 클래스의 메서드 호출
    }

    @Transactional
    public void saveWithTx(Order order) {
        orderRepository.save(order);
        pointService.accumulate(order); // 실패 시 주문도 롤백 기대
    }
}`,
    correct: 'reject',
    correctToken: '정확성',
    explain:
      '애노테이션은 있지만 트랜잭션은 열리지 않습니다. 스프링의 @Transactional은 프록시를 거쳐야 작동하는데, 같은 클래스 안에서의 호출(self-invocation)은 프록시를 우회합니다. 포인트 적립이 실패해도 주문은 롤백되지 않습니다 — 단위 테스트의 가짜 저장소로는 영원히 재현되지 않는 종류의 버그입니다.',
  },
  {
    id: 'swipe-retry-pay-01',
    title: '결제 호출에 재시도를 넣었습니다',
    code: `public PayResult pay(PayRequest req) {
    for (int attempt = 1; attempt <= 3; attempt++) {
        try {
            return pgClient.charge(req); // 외부 PG 호출
        } catch (TimeoutException e) {
            log.warn("PG timeout, retry {}", attempt);
        }
    }
    throw new PayFailedException();
}`,
    correct: 'question',
    correctToken: '계약',
    explain:
      '이 카드의 정답은 판정이 아니라 질문입니다: "PG의 charge는 멱등한가요? 멱등키를 받나요?" 타임아웃은 실패가 아니라 "결과를 모름"입니다 — 상대가 이미 처리했는데 응답만 유실됐다면, 재시도는 이중 청구가 됩니다. 그 답을 듣기 전까지 이 코드는 승인할 수도 반려할 수도 없습니다.',
  },
  {
    id: 'swipe-fallback-empty-01',
    title: '조회 실패 시 우아하게 빈 목록을 돌려줍니다',
    code: `public CompletableFuture<List<Coupon>> myCoupons(String userId) {
    return couponClient.fetch(userId)
        .exceptionally(e -> {
            log.warn("coupon fetch failed", e);
            return Collections.emptyList();
        });
}`,
    correct: 'reject',
    correctToken: '계약',
    explain:
      '"쿠폰이 없음"과 "쿠폰 시스템이 죽음"이 같은 값이 됩니다. 호출자는 이 둘을 구분할 방법이 없고, 화면은 성공한 얼굴로 "쿠폰이 없네요"라고 말합니다. 반환 계약에 저하(degraded) 상태를 표현할 자리가 없다는 것 — 그게 이 코드의 진짜 문제입니다. 로그 한 줄은 알리바이가 되지 못합니다.',
  },
  {
    id: 'swipe-guard-clause-01',
    title: '중첩 조건문을 가드 절로 폈습니다',
    code: `// before: if (user != null) { if (user.isActive()) { ... } }
public void grantBadge(User user) {
    if (user == null) return;
    if (!user.isActive()) return;
    if (badgeRepository.exists(user.id(), BADGE_FIRST_REVIEW)) return;

    badgeRepository.grant(user.id(), BADGE_FIRST_REVIEW);
}`,
    correct: 'merge',
    correctToken: '가독성',
    explain:
      '동작 변화 없이 읽기만 좋아진 변경입니다. 조기 반환으로 "배지를 주지 않는 세 가지 이유"가 위에서부터 차례로 읽히고, 본문은 한 줄로 남았습니다. 이런 PR은 오래 붙잡을수록 손해입니다 — 빠르게 머지하는 것도 리뷰 실력입니다.',
  },
  {
    id: 'swipe-localdatetime-01',
    title: '이벤트 마감 체크를 구현했습니다',
    code: `public boolean isOpen(Event event) {
    LocalDateTime now = LocalDateTime.now();
    return now.isBefore(event.getDeadline());
}`,
    correct: 'reject',
    correctToken: '정확성',
    explain:
      '이 now()는 "어디의 지금"입니까? 서버 기본 시간대에 따라 같은 순간이 다른 값이 됩니다. 한국 단일 서버에선 오래 맞다가, 리전 이전이나 컨테이너 TZ 변경 한 번에 전국의 마감이 9시간 미끄러집니다. 시각 비교에는 시간대가 계약에 포함된 타입(Instant, ZonedDateTime)과 주입된 Clock이 필요합니다.',
  },
  {
    id: 'swipe-todo-cache-01',
    title: '인기 상품 목록에 캐시를 달았습니다',
    code: `private List<Product> cache;
private Instant cachedAt;

public List<Product> popular() {
    if (cache != null && cachedAt.plusSeconds(60).isAfter(Instant.now())) {
        return cache;
    }
    cache = productRepository.findPopular(20);
    cachedAt = Instant.now();
    return cache;
    // TODO: 다중 인스턴스가 되면 공유 캐시로
}`,
    correct: 'merge',
    correctToken: '지금은 아님',
    explain:
      '단일 인스턴스 전제에서는 충분히 정직한 60초 캐시입니다. 동시 갱신 경합이나 공유 캐시는 지금 규모에선 과설계고, 작성자도 TODO로 한계를 밝혔습니다. "더 잘할 수 있다"는 반려 사유가 아닙니다 — 후속 티켓 하나 달고 보내는 것이 맞습니다.',
  },
];

export default { swipeCards, REASON_TOKENS };
