/**
 * 사건 파일 — 장애 포스트모템 추리 연속극 (Claude 전담 콘텐츠)
 * 매일 단서 1개씩 5일, 마지막 날 근본 원인을 지목한다.
 * 단서에는 미끼(red herring)가 섞여 있다 — 전부 사실이지만 전부 원인은 아니다.
 */

const caseFiles = [
  {
    id: 'case-vanishing-points-01',
    emoji: '🕵️',
    title: '사라지는 적립금',
    tagline: '매일 새벽, 아무도 모르게 포인트가 조금씩 증발한다',
    intro:
      '구독형 커머스 「데일리박스」의 CS 게시판에 같은 문의가 사흘째 쌓이고 있습니다. "적립금이 어제보다 줄었어요. 쓴 적이 없는데요." 금액은 제각각이고, 전원도 아니고 일부 고객만. 재현은 안 되고, 그래프는 새벽에만 움직입니다. 당신은 오늘부터 닷새간 매일 단서 하나씩을 받습니다. 서두르지 마세요 — 결론을 아끼는 것이 수사의 절반입니다.',
    days: [
      {
        day: 1,
        kind: '민원과 그래프',
        title: '피해자들의 공통점',
        content:
          '민원 41건 표본 정리:\n- 피해 금액: 100~3,000P, 고객마다 다름. 단 **같은 고객은 항상 같은 금액**이 반복해서 빠짐.\n- 발생 시각: 고객이 알아챈 건 아침이지만, 포인트 이력상 차감 기록은 **새벽 0시대와 새벽 1시대에 몰려** 있음.\n- 피해 고객 공통점: 전원이 "포인트 자동 소멸 안내" 대상자 (유효기간 만료 포인트 보유).\n- 비피해 고객: 만료 예정 포인트가 없는 고객은 단 한 건도 없음.\n\n📎 수사 노트: 만료 포인트 차감 자체는 정상 업무다. 문제는 "얼마나" 빠졌는가다.',
      },
      {
        day: 2,
        kind: '로그 발췌',
        title: '새벽 0시 14분과 1시 14분',
        content:
          '```\n00:14:02 INFO  [expire-batch] run=exp_20260801_a9 start targets=1,284\n00:14:37 WARN  [point-tx] slow transaction detected (1.2s) — acquiring row lock cust_88213\n00:15:11 INFO  [expire-batch] run=exp_20260801_a9 done expired=1,284 total=-1,912,300P\n01:14:05 INFO  [expire-batch] run=exp_20260801_c2 start targets=1,284\n01:15:20 INFO  [expire-batch] run=exp_20260801_c2 done expired=1,284 total=-1,912,300P\n```\n\n같은 날 만료 배치가 **run ID를 달리하여 두 번** 돌았고, 두 번 모두 "성공"했습니다. 대상 수와 총액이 정확히 같습니다.\n\n📎 수사 노트: 00:14의 slow transaction WARN이 눈에 띄지만 — 경고와 원인은 다른 것일 수 있다.',
      },
      {
        day: 3,
        kind: '배포 이력',
        title: '2주 전, 무슨 일이 있었나',
        content:
          '최근 배포·인프라 변경 이력:\n- D-16: 조회 성능 개선 — 포인트 잔액 **캐시 도입** (TTL 5분)\n- D-14: 트래픽 증가 대응 — **배치 서버 1대 → 2대 증설** (신규 장비는 해외 리전 표준 이미지)\n- D-9: 만료 안내 문구 수정 (프론트만)\n- D-3: 특이 없음\n\n피해 민원의 첫 접수일은 **D-13**입니다.\n\n📎 수사 노트: 시간축을 겹쳐 보라. 캐시(D-16)와 증설(D-14), 민원 시작(D-13) — 어느 쪽이 더 가까운가. 그리고 어제 로그의 두 run은 "언제부터" 두 번이었을까.',
      },
      {
        day: 4,
        kind: '설정 파일',
        title: '두 서버의 자정',
        content:
          '배치 서버 2대의 크론과 환경:\n```\n# batch-01 (기존, 서울)\nTZ=Asia/Seoul\n14 0 * * *  run-expire-batch.sh\n\n# batch-02 (증설, 표준 이미지)\nTZ=UTC\n14 0 * * *  run-expire-batch.sh\n```\n\n같은 crontab이 복사됐지만, 시간대가 다릅니다. batch-01의 0시 14분은 KST, batch-02의 0시 14분은 UTC — 즉 **KST 오전 9시 14분**… 이 아니라, 로그의 두 번째 실행은 01:14였습니다.\n\n📎 수사 노트: UTC 0:14 = KST 9:14인데 로그는 왜 1:14인가? 애플리케이션 로그의 타임스탬프는 앱의 시간대(KST)로 찍힌다. 그렇다면 batch-02의 크론 시간대는 정말 UTC인가 — 아니면 이미지의 **기본 시간대가 또 다른 무엇**인가. 확실한 것 하나: 실행 주체가 둘이라는 것.',
      },
      {
        day: 5,
        kind: '코드',
        title: '차감 로직의 민낯',
        content:
          '```java\n// ExpirePointService.java (발췌)\npublic void expire(LocalDate baseDate) {\n    List<PointLot> targets = pointLotRepository\n        .findExpiredLots(baseDate); // 만료일 <= baseDate, 상태 무관\n    for (PointLot lot : targets) {\n        pointService.deduct(lot.customerId(), lot.remaining(),\n            "만료 소멸"); // 차감 이력 insert\n    }\n}\n```\n\n- 대상 조회에 "이미 소멸 처리됨" 상태 필터가 없습니다.\n- `deduct`에는 배치 run이나 lot 기준의 **멱등키가 없습니다** — 같은 lot이 두 번 오면 두 번 차감됩니다.\n- 그래서 같은 고객이 항상 같은 금액을 반복해서 잃었던 겁니다: 그 고객의 만료 lot 금액만큼, 실행 횟수만큼.\n\n이제 지목할 시간입니다.',
      },
    ],
    finale: {
      question: '이 사건의 근본 원인은 무엇입니까?',
      options: [
        {
          key: 'cron-idempotency',
          label: '증설 서버의 크론이 시간대 차이로 이중 실행됐고, 만료 차감에 멱등성이 없었다',
        },
        {
          key: 'cache',
          label: 'D-16에 도입한 잔액 캐시가 낡은 값을 보여줘 차감이 중복 계산됐다',
        },
        {
          key: 'slow-tx',
          label: '00:14의 slow transaction이 롤백 없이 반영돼 이중 차감을 만들었다',
        },
        {
          key: 'fraud',
          label: '일부 고객의 포인트 부정 사용이 새벽 배치 시간과 겹쳐 보였다',
        },
      ],
      answerKey: 'cron-idempotency',
      explanation:
        '방아쇠는 D-14의 증설입니다 — 같은 crontab, 다른 시간대의 서버가 하나 더 생기며 만료 배치가 하루 두 번 실행됐습니다. 그러나 방아쇠와 화약은 다릅니다. 화약은 처음부터 코드에 있었습니다: 대상 조회에 상태 필터가 없고 차감에 멱등키가 없어서, 두 번째 실행이 얌전히 한 번 더 차감한 것. 캐시(D-16)는 조회 전용이라 무죄고, slow transaction WARN은 그저 그날 밤도 느렸다는 뜻이며, 피해 패턴(같은 고객 같은 금액 반복)은 부정 사용과 정반대의 지문입니다. 단일 실행을 전제한 배치는 실행 주체가 둘이 되는 순간 무너집니다 — 배치의 안전은 스케줄러가 아니라 멱등성이 지킵니다.',
      epilogue:
        '수정은 세 줄이었습니다: 대상 조회에 상태 필터, 차감에 lot 단위 멱등키, 그리고 crontab 아래 주석 한 줄 — "이 배치는 두 번 돌아도 안전하다. 2026년 8월, 우리는 그렇지 않았던 새벽을 기억한다." 41명의 고객에게는 사라진 포인트에 이자를 얹어 돌려드렸습니다. batch-02는 여전히 UTC로 삽니다. 아무도 시간대를 다시 믿지 않게 됐거든요.',
    },
  },
];

export default { caseFiles };
