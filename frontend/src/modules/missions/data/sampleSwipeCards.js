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
  {
    id: 'swipe-n-plus-one-01',
    title: '주문 목록에 고객 이름을 붙였습니다',
    code: `public List<OrderView> orders() {
    return orderRepository.findRecent(50).stream()
        .map(o -> new OrderView(
            o.getId(),
            customerRepository.findById(o.getCustomerId())
                .map(Customer::getName).orElse("(탈퇴)"),
            o.getTotal()))
        .toList();
}`,
    correct: 'reject',
    correctToken: '운영',
    explain:
      '기능은 정확하고 테스트도 통과합니다 — 주문 50건 화면을 위해 쿼리를 51번 날린다는 것만 빼면요. 로컬 DB에서는 티도 안 나지만, 운영의 네트워크 왕복 51번은 다른 이야기입니다. 목록 조회에서 루프 안의 단건 조회가 보이면, 조인이나 IN 조회 한 번으로 바꿀 수 있는지부터 묻는 것이 리뷰어의 조건반사여야 합니다.',
  },
  {
    id: 'swipe-secret-config-01',
    title: '외부 API 연동 설정을 추가했습니다',
    code: `# application.yml
payment:
  gateway:
    base-url: https://api.pg-partner.com
    api-key: pk_live_51Hx7a2Kb9mQw3eRt
    timeout-ms: 3000`,
    correct: 'reject',
    correctToken: '운영',
    explain:
      '설정 구조는 흠잡을 데 없습니다. 문제는 라이브 키가 저장소에 커밋된다는 것 — 이 파일을 읽을 수 있는 모든 사람, 모든 CI 로그, 그리고 미래의 저장소 공개 순간까지 키가 함께 갑니다. 커밋된 비밀은 지워도 히스토리에 남아서, 발견 즉시 회전(재발급)이 유일한 치료입니다. 키는 환경변수나 시크릿 매니저로 — 파일에는 `${PG_API_KEY}` 자리만 남기세요.',
  },
  {
    id: 'swipe-log-pii-01',
    title: '가입 실패 디버깅용 로그를 넣었습니다',
    code: `public void register(SignupRequest req) {
    log.info("signup attempt: name={}, phone={}, rrn={}",
        req.name(), req.phone(), req.residentRegNo());
    validator.validate(req);
    memberService.create(req);
}`,
    correct: 'reject',
    correctToken: '운영',
    explain:
      '디버깅 의도는 정당하지만, 주민등록번호가 로그 파일로 흘러가는 순간 로그 시스템 전체가 개인정보 저장소가 됩니다 — 보존 기간, 접근 권한, 검색 인덱스까지 전부요. 로그는 코드보다 훨씬 많은 사람이 봅니다. 식별자는 마스킹하거나 내부 ID로 치환하고, "로그에 남겨도 되는가"를 필드마다 물어야 합니다.',
  },
  {
    id: 'swipe-entity-equals-01',
    title: '엔티티 비교가 편해지게 @Data를 붙였습니다',
    code: `@Entity
@Data // getter/setter/equals/hashCode 자동 생성
public class Coupon {
    @Id @GeneratedValue
    private Long id;
    private String code;
    private CouponStatus status; // 사용 시 USED로 변경
}`,
    correct: 'reject',
    correctToken: '정확성',
    explain:
      '@Data의 equals/hashCode는 모든 필드를 씁니다 — status가 바뀌는 순간 해시가 바뀝니다. 이 쿠폰을 HashSet에 넣고 사용 처리하면, 같은 객체인데도 contains가 false를 돌려주는 유령이 됩니다. 저장 전에는 id가 null이라는 문제도 겹치고요. 엔티티의 동일성은 식별자 기준으로 직접 정의하는 것이 안전합니다.',
  },
  {
    id: 'swipe-optional-contract-01',
    title: '조회 실패를 null 대신 Optional로 바꿨습니다',
    code: `// before: public Member find(String email) { ... return null; }
public Optional<Member> find(String email) {
    return memberRepository.findByEmail(email);
}
// 호출부도 함께 수정
mailer.send(memberService.find(email)
    .orElseThrow(MemberNotFoundException::new));`,
    correct: 'merge',
    correctToken: '계약',
    explain:
      '"없을 수 있음"이 시그니처에 올라왔습니다 — 이제 컴파일러가 모든 호출자에게 빈 경우를 처리했는지 묻습니다. null 반환은 문서에만 존재하던 암묵 계약이었고, 이 변경은 그 계약을 타입으로 승격시켰습니다. 호출부까지 함께 고친 것도 좋습니다. 이런 PR은 계약이 명확해진 것 자체가 가치입니다.',
  },
  {
    id: 'swipe-batch-update-01',
    title: '휴면 회원 일괄 전환 배치를 만들었습니다',
    code: `@Scheduled(cron = "0 0 4 * * *")
public void convertDormant() {
    int updated = jdbcTemplate.update(
        "UPDATE member SET status = 'DORMANT' " +
        "WHERE last_login_at < NOW() - INTERVAL 365 DAY");
    log.info("dormant converted: {}", updated);
}`,
    correct: 'question',
    correctToken: '운영',
    explain:
      '이 카드의 정답은 질문입니다: "대상이 몇 건이고, 그 UPDATE는 락을 얼마나 잡나요?" 대상이 300건이면 훌륭한 코드지만, 300만 건이면 새벽 4시에 member 테이블을 통째로 잠그는 사건이 됩니다. 같은 코드의 판정이 데이터 규모에 따라 뒤집히는 것 — 그래서 물어보기 전엔 머지도 반려도 할 수 없습니다. (규모가 크면 청크 분할과 유휴 시간 확인이 따라와야 하고요.)',
  },
];

export default { swipeCards, REASON_TOKENS };
