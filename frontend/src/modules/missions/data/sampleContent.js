/**
 * Developer Advisor — 미션 샘플 콘텐츠
 * 대상 학습자: 비 IT기업 3년차 자바 개발자
 * 약점: 인터페이스 개념, 코드 분리/책임 나누기
 * 부가 목표: 다양한 도메인 상식, 조리있게 설명하는 훈련
 */

const missions = [
  // =========================================================================
  // Mission 1 — Stage 1 "분리의 감각" / 와인 / 리팩토링
  // =========================================================================
  {
    id: 's1-wine-01',
    stage: 1,
    stageTitle: '분리의 감각',
    missionType: '리팩토링',
    difficulty: 'Easy',
    scope: '단일 파일',
    modes: ['developer'],
    providedFiles: [],
    domain: '와인',
    domainEmoji: '🍷',
    title: '와인 추천기의 뒤엉킨 책임 풀어내기',
    estimatedMinutes: 90,
    briefing: {
      title: '소믈리에는 사실 규칙 엔진이다 — 와인 추천의 세계',
      content: `### 품종이 8할이다

와인 맛의 큰 틀은 포도 **품종(varietal)** 이 결정합니다. 카베르네 소비뇽은 타닌이 강하고 묵직하며(풀바디), 피노 누아는 가볍고 산미가 살아 있고, 리슬링은 향이 화려하며 단맛부터 드라이까지 폭이 넓습니다. 샤르도네는 양조 방식에 따라 버터 같은 풍미부터 미네랄한 맛까지 변신하는 팔색조죠.

### 빈티지와 테루아

라벨의 연도인 **빈티지(vintage)** 는 포도를 수확한 해입니다. 그해 일조량과 강수량이 포도 품질을 좌우하기 때문에 같은 밭이라도 해마다 맛과 가격이 달라집니다. **테루아(terroir)** 는 토양·기후·경사 등 밭의 환경 전체를 가리키는 말로, "부르고뉴는 밭 이름으로 와인을 판다"는 말이 나올 만큼 유럽 와인 가격의 핵심 변수입니다.

### 페어링은 감이 아니라 규칙

음식 궁합(페어링)에는 검증된 규칙이 있습니다. 붉은 고기의 지방과 단백질은 타닌을 부드럽게 만들어 주기 때문에 스테이크·삼겹살에는 타닌 강한 레드가 어울리고, 매운 음식에는 알코올이 낮고 살짝 단 리슬링이 매운맛을 식혀 줍니다. 굴이나 회처럼 비린 해산물에 레드를 곁들이면 철분과 타닌이 만나 쇠맛이 나기 때문에 산미 좋은 화이트를 권하죠.

### 그래서 추천 시스템은 규칙 덩어리

소믈리에의 머릿속을 들여다보면 "바디 선호 ±1 이내인가", "예산 안인가", "음식과 품종 궁합 규칙에 걸리는가" 같은 **규칙의 조합과 가중치 계산**이 돌아갑니다. 와인 추천 소프트웨어가 if문 범벅이 되기 쉬운 이유가 바로 이것인데, 규칙이 많다는 것과 규칙이 한 덩어리여야 한다는 것은 전혀 다른 이야기입니다. 이번 미션에서 그 차이를 몸으로 확인하게 됩니다.`,
    },
    scenario: `사내 복지몰에 붙어 있는 **와인 추천 기능**을 물려받았습니다. 퇴사한 선임이 혼자 만든 코드인데, 명절 선물 시즌마다 규칙 수정 요청이 쏟아져서 매번 전체 코드를 다시 읽어야 하는 상황입니다. 운영팀은 "와인 목록도 곧 DB로 옮길 것"이라고 예고했습니다. 동작은 그대로 유지하면서, 다음 요청이 와도 겁나지 않는 구조로 정리해 주세요.`,
    legacyFiles: [
      {
        path: 'src/main/java/com/daehan/welfare/WineRecommender.java',
        content: `package com.daehan.welfare;

public class WineRecommender {

    // req 예시: "바디=3;당도=2;예산=60000;음식=삼겹살;등급=GOLD"
    public String recommend(String req) {
        int body = 0;
        int sweet = 0;
        int budget = 0;
        String food = "";
        String grade = "NORMAL";

        String[] parts = req.split(";");
        for (int i = 0; i < parts.length; i++) {
            String[] kv = parts[i].split("=");
            if (kv[0].equals("바디")) {
                body = Integer.parseInt(kv[1]);
            } else if (kv[0].equals("당도")) {
                sweet = Integer.parseInt(kv[1]);
            } else if (kv[0].equals("예산")) {
                budget = Integer.parseInt(kv[1]);
            } else if (kv[0].equals("음식")) {
                food = kv[1];
            } else if (kv[0].equals("등급")) {
                grade = kv[1];
            }
        }

        // 와인 데이터 (순서 맞춰야 함!! 절대 한 배열만 수정하지 말 것)
        String[] names = {"카시야스 리제르바", "몽테 발롱 피노", "루카스 리슬링 카비네트", "돌체 로쏘 프리잔테", "샤블리 프리미에 크뤼"};
        String[] grapes = {"카베르네 소비뇽", "피노 누아", "리슬링", "람브루스코", "샤르도네"};
        int[] bodies = {5, 3, 2, 2, 3};
        int[] sweets = {1, 1, 3, 4, 1};
        int[] prices = {88000, 62000, 45000, 32000, 71000};

        int bestIdx = -1;
        int bestScore = -999;
        for (int i = 0; i < names.length; i++) {
            int score = 0;

            // 바디 매칭
            if (bodies[i] == body) {
                score = score + 30;
            } else {
                if (bodies[i] - body == 1 || body - bodies[i] == 1) {
                    score = score + 15;
                } else {
                    score = score - 10;
                }
            }

            // 당도 매칭
            if (sweets[i] == sweet) {
                score = score + 25;
            } else {
                if (sweets[i] - sweet == 1 || sweet - sweets[i] == 1) {
                    score = score + 10;
                }
            }

            // 예산 (조금 넘는 건 봐준다 - 영업팀 요청)
            if (prices[i] <= budget) {
                score = score + 20;
            } else {
                if (prices[i] <= budget + 10000) {
                    score = score + 5;
                } else {
                    score = score - 50;
                }
            }

            // 음식 페어링 가산점
            switch (food) {
                case "삼겹살":
                case "스테이크":
                    if (grapes[i].equals("카베르네 소비뇽")) score = score + 20;
                    if (grapes[i].equals("피노 누아")) score = score + 10;
                    break;
                case "매운탕":
                case "떡볶이":
                    if (grapes[i].equals("리슬링")) score = score + 20;
                    if (grapes[i].equals("람브루스코")) score = score + 15;
                    break;
                case "회":
                case "굴":
                    if (grapes[i].equals("샤르도네")) score = score + 20;
                    if (grapes[i].equals("리슬링")) score = score + 10;
                    break;
                default:
                    break;
            }

            if (score > bestScore) {
                bestScore = score;
                bestIdx = i;
            }
        }

        if (bestIdx == -1) {
            return "추천 가능한 와인이 없습니다.";
        }

        // 회원 등급 할인
        int price = prices[bestIdx];
        int finalPrice = price;
        if (grade.equals("GOLD")) {
            finalPrice = (int) (price * 0.9);
        } else if (grade.equals("VIP")) {
            finalPrice = (int) (price * 0.85);
        }
        if (price >= 80000 && grade.equals("VIP")) {
            finalPrice = finalPrice - 5000; // VIP 고가와인 쿠폰 (2023 프로모션, 아직 살아있음)
        }

        // 결과 문자열 조립
        StringBuilder sb = new StringBuilder();
        sb.append("[추천 와인] ").append(names[bestIdx]).append("\\n");
        sb.append("품종: ").append(grapes[bestIdx]).append("\\n");
        sb.append("적합도 점수: ").append(bestScore).append("점\\n");
        sb.append("정가: ").append(price).append("원");
        if (finalPrice != price) {
            sb.append(" -> 할인가: ").append(finalPrice).append("원");
        }
        return sb.toString();
    }
}`,
      },
    ],
    requirements: [
      '추천 결과(문구·점수·가격)는 리팩토링 전과 완전히 동일해야 합니다.',
      '운영팀이 와인 목록을 곧 DB로 옮길 예정이므로, 와인 데이터가 어디서 오는지 바뀌어도 추천 로직은 손대지 않게 해 주세요.',
      '명절마다 바뀌는 것은 주로 "음식 페어링 규칙"과 "할인 정책"입니다. 이 둘은 각각 한 곳만 고치면 되게 정리해 주세요.',
      '예산을 조금 초과하는 와인도 후보에 남기는 지금의 배려는 유지해 주세요. (얼마까지가 "조금"인지는 영업팀과 협의된 문서가 없습니다)',
      '새 입사자가 recommend 흐름을 5분 안에 파악할 수 있는 수준의 가독성을 목표로 합니다.',
    ],
    constraints: [
      '외부 라이브러리 추가 금지 (사내 보안 심사 이슈), 순수 Java 17 표준 라이브러리만 사용.',
      '도메인 규칙: 페어링 가산점은 품종 기준으로만 부여합니다. 와인 개별 상품 기준 규칙은 아직 없습니다.',
      '공개 진입점 recommend(String req)의 시그니처는 복지몰 다른 모듈이 호출 중이므로 바꿀 수 없습니다.',
      '시험 중 시음은 허용됩니다. 단, 커밋은 취하기 전에 하세요.',
    ],
    learningGoals: [
      '한 메서드에 섞인 여러 책임(파싱·데이터·점수 계산·할인·포맷팅)을 식별하고 이름 붙이기',
      'String/int 나열(원시 타입 집착)을 Wine, TastePreference 같은 의미 있는 타입으로 바꾸는 감각 익히기',
      '"자주 바뀌는 것"과 "안 바뀌는 것"을 기준으로 분리 경계를 정하는 연습',
      '동작을 보존하면서 구조만 바꾸는 리팩토링의 규율 체득',
    ],
    hints: [
      'recommend()를 소리 내어 읽으며 "지금 이 줄은 무슨 일을 하지?"라고 물어보세요. 대답이 바뀌는 지점이 분리 후보입니다.',
      '5개의 병렬 배열(names, grapes, bodies...)이 같은 인덱스로 묶여 다닙니다. 같이 다니는 데이터는 하나의 클래스가 되고 싶어 하는 신호입니다.',
      '분리 순서 제안: (1) Wine 레코드 도입 → (2) 입력 파싱을 TastePreference로 추출 → (3) 점수 계산 / 페어링 규칙 / 할인 정책 / 포맷터를 각각 클래스로. 각 단계마다 결과가 같은지 확인하세요.',
    ],
    hiddenCases: [
      {
        title: '예산 0원 손님',
        description:
          '예산=0 또는 음수가 들어오면 모든 와인이 -50점을 받고도 "최고점" 와인이 버젓이 추천됩니다. 잘못된 입력이 그럴듯한 결과로 둔갑하는 것이 최악의 실패 모드입니다. 좋은 방어: 파싱 직후 입력 검증 계층에서 예산·바디·당도의 유효 범위를 확인하고, 벗어나면 조용히 계속하지 말고 명시적으로 실패(예외 또는 오류 응답)하세요.',
      },
      {
        title: 'G0LD 회원의 침묵',
        description:
          '등급에 "G0LD"(알파벳 O가 아니라 숫자 0)가 들어오면 equals 비교가 조용히 실패해 할인 없이 정가가 안내됩니다. 에러도 로그도 없이 "정상처럼 보이는 오답"이 나가는 케이스입니다. 좋은 방어: 등급을 문자열 비교가 아니라 enum 변환으로 처리하고, 변환에 실패하면 알 수 없는 등급임을 명시적으로 드러내세요. 실제 커머스 서비스들이 쿠폰 코드·등급 오타를 조용히 무할인 처리했다가 CS 폭주로 배우는 단골 장애 유형입니다.',
      },
      {
        title: '메뉴에 없는 음식',
        description:
          '"굴"은 페어링 규칙이 있지만 "굴전"은 switch의 default로 빠져 가산점 0점, 추천이 소리 없이 왜곡됩니다. 좋은 방어: 지원하는 음식 목록을 한 곳에서 관리하고, 목록 밖 입력은 로그를 남기거나 "페어링 미반영" 사실을 결과에 명시해 사용자와 운영자 모두 알게 하세요.',
      },
    ],
    rubric: [
      {
        name: '책임 분리',
        description: '파싱·데이터 보관·점수 계산·페어링 규칙·할인·출력 포맷팅이 각각 응집된 단위로 분리되었는가. 한 클래스를 고칠 이유가 하나뿐인가.',
        weight: 30,
        visibleToLearner: true,
      },
      {
        name: '도메인 개념의 타입화',
        description: '병렬 배열과 원시 타입 나열이 Wine, TastePreference 등 도메인 언어를 담은 타입으로 대체되었는가.',
        weight: 20,
        visibleToLearner: true,
      },
      {
        name: '동작 보존',
        description: '동일 입력에 대해 리팩토링 전후 출력이 완전히 일치하는가. 일치를 스스로 검증한 흔적(테스트 등)이 있는가.',
        weight: 20,
        visibleToLearner: true,
      },
      {
        name: '가독성과 네이밍',
        description: '매직 넘버가 의미 있는 상수/정책으로 바뀌었고, 이름만 읽어도 도메인 규칙이 드러나는가.',
        weight: 15,
        visibleToLearner: true,
      },
      {
        name: '모호한 요구사항 확인',
        description: '"예산을 조금 초과" 등 정의되지 않은 규칙에 대해 임의로 확정하지 않고 질문했거나, 가정을 명시적으로 기록했는가.',
        weight: 15,
        visibleToLearner: false,
      },
    ],
    explainTask: {
      audience: '와인 수입사에서 일하다 복지몰 상품기획자로 이직한 소믈리에 출신 기획자 (비개발자)',
      prompt:
        '리팩토링한 추천 시스템의 구조를 이 기획자에게 설명해 주세요. 목표는 두 가지입니다. (1) "페어링 규칙을 바꾸고 싶으면 어디가 바뀌는지"를 기획자가 그림 그리듯 이해하게 할 것, (2) 소믈리에가 손님을 상대하는 사고 과정에 빗대어, 코드의 각 부분이 어떤 역할인지 비유로 연결할 것. 기술 용어(클래스, 인터페이스 등)는 써도 되지만, 쓸 때마다 일상어로 한 번 풀어 주세요.',
    },
    endings: [
      {
        grade: 'calm',
        title: '소믈리에의 무관심',
        teaser: '아무도 시스템을 의심하지 않는다. 명절 규칙 변경은 커밋 하나로 끝나고, 당신의 이름은 장애 채널에 한 번도 등장하지 않는다.',
      },
      {
        grade: 'hotfix',
        title: '명절마다 열리는 파일',
        teaser: '돌아는 간다. 다만 설과 추석마다 recommend()가 다시 열리고, 당신은 그 diff를 조용히 승인하는 사람이 된다.',
      },
      {
        grade: 'dawn',
        title: '정가 88,000원의 밤',
        teaser: '단체 구매일에 무할인 정가가 일괄 안내되고, 그 사실을 개발팀보다 CS 큐가 먼저 안다. 당신의 커밋 해시는 장애 보고서 첫 줄에 박제된다.',
      },
      {
        grade: 'hidden',
        title: '???',
        teaser: '이 결말을 본 수강생은 아직 없습니다. 조건은 비공개입니다.',
      },
    ],
  },

  // =========================================================================
  // Mission 2 — Stage 2 "인터페이스는 계약" / 가구 조립 파이프라인 / 기능 추가
  // =========================================================================
  {
    id: 's2-furniture-01',
    stage: 2,
    stageTitle: '인터페이스는 계약',
    missionType: '기능 추가',
    difficulty: 'Normal',
    scope: '여러 파일',
    modes: ['developer'],
    providedFiles: [],
    domain: '가구 조립 파이프라인',
    domainEmoji: '🪑',
    title: '생산 라인에 공정 두 개를 끼워 넣어라',
    estimatedMinutes: 120,
    briefing: {
      title: '테이블 다리를 잘라낸 날 — 플랫팩 가구와 생산 파이프라인',
      content: `### 자동차 트렁크에서 시작된 산업

1956년, 이케아 직원 길리스 룬드그렌은 배송할 테이블이 차에 들어가지 않자 **다리를 떼어내 상판 밑에 붙여** 실었습니다. 이 임기응변이 "완성품 대신 납작한 상자를 판다"는 **플랫팩(flat-pack)** 혁명이 됐죠. 운송 부피가 극적으로 줄어 물류비가 내려갔고, 조립이라는 마지막 공정을 고객에게 넘기면서 가격은 더 내려갔습니다. 오늘날 이케아가 세계 최대 가구 기업이 된 출발점입니다.

### 공장 안에서는 무슨 일이 벌어지나

플랫팩 가구 공장의 생산 흐름은 대체로 이렇게 이어집니다. **재단**(큰 판재를 부품 치수로 자르기) → **가공**(구멍 뚫기·홈 파기·모서리에 띠를 두르는 엣지밴딩) → 필요 시 **도장**(칠하고 건조) → **포장**(부품·나사·설명서를 한 상자에) → **출고**. 책장은 선반 구멍을 32mm 간격으로 뚫는 "시스템 32" 규격을 쓰고, 책상은 다리 결합용 금속 인서트를 박는 식으로 **제품마다 공정의 내용과 순서가 조금씩 다릅니다.**

### 왜 라인은 "단계"로 사고할까

생산관리에서는 라인을 하나의 긴 작업이 아니라 **독립된 공정(스테이션)의 나열**로 봅니다. 이유는 현실적입니다. 신제품이 나오면 공정을 끼워 넣거나 빼야 하고, 도장 설비가 고장 나면 그 공정만 외주로 돌려야 하고, 병목이 생기면 특정 공정만 증설해야 하니까요. 각 공정은 "규격에 맞는 반제품을 받아, 규격에 맞는 반제품을 넘긴다"는 **약속(계약)** 만 지키면 서로의 내부를 몰라도 됩니다. 컨베이어 벨트가 물리 세계의 인터페이스인 셈이죠. 이번 미션의 소프트웨어도 정확히 같은 압력을 받게 됩니다.`,
    },
    scenario: `사무가구를 만드는 우리 회사가 **온라인 커스텀 주문**을 시작하면서 생산관리 시스템에 요구가 몰리고 있습니다. 지금까지는 책장(BOOKSHELF)과 책상(DESK)을 재단→가공→포장 순서로만 처리했는데, 다음 분기부터 **도장(painting) 공정**과 **검수(inspection) 공정**이 추가되고, 제품마다 공정 순서가 달라집니다. 생산관리 팀장님은 "앞으로도 공정은 계속 늘어날 것"이라고 못 박았습니다.`,
    legacyFiles: [
      {
        path: 'src/main/java/com/daehan/factory/AssemblyPipeline.java',
        content: `package com.daehan.factory;

public class AssemblyPipeline {

    public void process(WorkOrder order) {
        System.out.println("=== 작업지시 시작: " + order.getOrderId() + " ===");
        cut(order);
        drill(order);
        pack(order);
        System.out.println("=== 작업지시 완료: " + order.getOrderId() + " ===");
    }

    private void cut(WorkOrder order) {
        if (order.getType().equals("BOOKSHELF")) {
            System.out.println("[재단] 18T 파티클보드 재단 - " + order.getQuantity() + "세트");
        } else if (order.getType().equals("DESK")) {
            System.out.println("[재단] 상판용 MDF 재단 - " + order.getQuantity() + "세트");
        } else {
            System.out.println("[재단] 표준 재단 - " + order.getQuantity() + "세트");
        }
        order.setStatus("CUT_DONE");
    }

    private void drill(WorkOrder order) {
        if (order.getType().equals("BOOKSHELF")) {
            System.out.println("[가공] 선반 핀홀 32mm 간격 타공 + 엣지밴딩");
        } else if (order.getType().equals("DESK")) {
            System.out.println("[가공] 다리 결합용 인서트 너트 압입");
        } else {
            System.out.println("[가공] 표준 가공");
        }
        order.setStatus("DRILL_DONE");
    }

    private void pack(WorkOrder order) {
        if (order.getQuantity() >= 10) {
            System.out.println("[포장] 팔레트 단위 포장 (" + order.getQuantity() + "세트)");
        } else {
            System.out.println("[포장] 개별 박스 포장 (" + order.getQuantity() + "세트)");
        }
        order.setStatus("PACKED");
    }
}`,
      },
      {
        path: 'src/main/java/com/daehan/factory/WorkOrder.java',
        content: `package com.daehan.factory;

public class WorkOrder {

    private final String orderId;
    private final String type;      // BOOKSHELF, DESK ...
    private final int quantity;
    private String status;

    public WorkOrder(String orderId, String type, int quantity) {
        this.orderId = orderId;
        this.type = type;
        this.quantity = quantity;
        this.status = "CREATED";
    }

    public String getOrderId() {
        return orderId;
    }

    public String getType() {
        return type;
    }

    public int getQuantity() {
        return quantity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}`,
      },
    ],
    requirements: [
      '커스텀 책상(DESK) 주문은 다음 분기부터 재단 → 가공 → 도장 → 검수 → 포장 순서로 처리되어야 합니다. 도장 공정은 주문서에 적힌 색상으로 칠합니다.',
      '책장(BOOKSHELF)은 도장 없이 재단 → 가공 → 포장 그대로 가되, 10세트 이상 대량 주문일 때만 포장 전에 검수를 거칩니다.',
      '팀장님 요청: "다음에 새 공정(예: 조립 시연 영상 촬영)이 생기면, 기존 공정 코드는 건드리지 않고 새 공정만 만들어 끼우고 싶다."',
      '공정이 끝날 때마다 지금처럼 작업지시(WorkOrder)의 상태가 갱신되어야 하며, 어떤 공정을 거쳤는지 이력이 남아야 합니다.',
      '검수는 필요한 제품에만 하면 됩니다. (어떤 제품이 "필요한" 쪽인지 기준 문서는 아직 없습니다)',
      '기존 책장·책상 주문의 처리 결과(출력 내용과 순서)는 지금과 달라지면 안 됩니다.',
    ],
    constraints: [
      '도메인 규칙: 도장은 반드시 가공 이후에만 가능합니다. (표면 타공 후 도장해야 칠이 갈라지지 않음)',
      '도메인 규칙: 검수는 항상 포장보다 앞서야 합니다. 포장을 뜯고 검수할 수는 없습니다.',
      '신규 제품 타입이 추가될 예정이므로, 제품 타입 문자열 비교가 코드 곳곳에 흩어지지 않게 해 주세요.',
      '외부 라이브러리 없이 순수 Java 17로 작성합니다.',
      '조립 후 남는 나사 네 개는 버그가 아니라 기본 제공 사양입니다. 남는 공정은 버그입니다.',
    ],
    learningGoals: [
      '"공정 하나"라는 공통 개념을 발견하고 계약(인터페이스)으로 승격시키는 경험',
      '구현이 아니라 계약에 의존하면, 새 공정 추가가 "기존 코드 수정"이 아니라 "새 클래스 추가"가 됨을 체감 (개방-폐쇄 원칙)',
      '제품별 공정 순서를 조건문 분기가 아니라 "구성(composition)"으로 표현하는 연습',
      '계약에 무엇을 넣고 무엇을 뺄지(메서드 시그니처 설계) 고민하는 훈련',
    ],
    hints: [
      '재단, 가공, 포장, 그리고 새로 올 도장, 검수. 이 다섯을 한 문장으로 공통되게 설명해 보세요. "___를 받아서 ___를 한다"가 똑같다면, 그 문장이 곧 계약입니다.',
      'process()가 공정의 "내용"을 아는 것과 공정의 "순서"를 아는 것은 다른 책임입니다. 파이프라인은 순서만 알고, 각 공정의 내용은 몰라도 되게 만들 수 있을까요?',
      'AssemblyStep 같은 인터페이스를 만들고, 제품 타입별로 List<AssemblyStep>을 조립해 주는 곳(팩토리)을 한 군데 두면, 팀장님의 "기존 코드 안 건드리고 끼우고 싶다"가 문자 그대로 이뤄집니다.',
    ],
    hiddenCases: [
      {
        title: '정체불명의 제품',
        description:
          '주문 시스템 오류로 타입에 "BOOKSHLEF" 같은 오타나 아직 없는 "WARDROBE"가 들어오면, 지금 코드는 조용히 "표준 재단"으로 흘려보냅니다. 옷장이 책장 공정을 타고 출고되는 셈이죠. 좋은 방어: 공정 순서를 조립하는 곳(팩토리)에서 알 수 없는 타입을 만나면 기본값으로 대충 만들지 말고 즉시 명시적으로 실패시키세요.',
      },
      {
        title: '공정 없는 작업지시',
        description:
          '공정 목록이 비어 있는 작업지시가 흘러들면, 파이프라인은 아무것도 하지 않고 "작업 완료"를 찍을 수 있습니다. 아무것도 만들지 않았는데 완료가 되는 것이 가장 위험한 침묵입니다. 좋은 방어: 실행 전에 최소 1개 공정을 검증하는 계층을 두고, 비어 있으면 명시적으로 실패하세요.',
      },
      {
        title: '도장 두 번 칠하기',
        description:
          '같은 공정이 실수로 두 번 등록되면(도장→도장) 조립된 순서 그대로 두 번 실행됩니다. 페인트는 두 겹, 납기는 하루 추가. 좋은 방어: 순서 구성 시점에 중복과 순서 규칙(가공→도장, 검수→포장)을 검증해, 잘못된 라인 구성이 공장으로 내려가기 전에 걸러지게 하세요.',
      },
    ],
    rubric: [
      {
        name: '공정 계약의 발견과 정의',
        description: '개별 공정들이 하나의 공통 계약(인터페이스)으로 추상화되었는가. 계약의 시그니처가 과하지도 부족하지도 않은가.',
        weight: 25,
        visibleToLearner: true,
      },
      {
        name: '확장에 열린 구조',
        description: '새 공정 추가 시 기존 공정·파이프라인 코드를 수정하지 않아도 되는가. 도장·검수가 실제로 그렇게 추가되었는가.',
        weight: 30,
        visibleToLearner: true,
      },
      {
        name: '제품별 순서 구성',
        description: '제품 타입에 따른 공정 순서가 if 분기 산탄총이 아니라 한 곳에서 조립되는가. 도메인 순서 규칙(가공→도장, 검수→포장)이 지켜지는가.',
        weight: 20,
        visibleToLearner: true,
      },
      {
        name: '기존 동작 보존',
        description: '기존 책장·책상 주문의 출력 내용과 순서, 상태 갱신이 변경 전과 동일한가.',
        weight: 15,
        visibleToLearner: true,
      },
      {
        name: '모호한 요구사항 확인',
        description: '"검수는 필요한 제품에만" 같은 미정의 기준을 임의 확정하지 않고 질문하거나 가정을 명시했는가.',
        weight: 10,
        visibleToLearner: false,
      },
    ],
    explainTask: {
      audience: '현장 20년 경력의 생산관리 팀장님 (비개발자, 공정 지식은 최고 수준)',
      prompt:
        '개편한 시스템 구조를 팀장님에게 설명해 주세요. 핵심 미션: "왜 이제는 새 공정이 생겨도 프로그램 전체를 뜯지 않아도 되는지"를 실제 공장 라인 운영(스테이션 증설, 외주 전환, 라인 재배치)에 빗대어 납득시키는 것. 인터페이스라는 단어를 쓴다면, 팀장님이 매일 보는 것 중 무엇이 인터페이스에 해당하는지 반드시 짚어 주세요.',
    },
    endings: [
      {
        grade: 'calm',
        title: '컨베이어는 말이 없다',
        teaser: '새 공정이 와도 라인은 멈추지 않는다. 팀장님은 다른 부서 회의에서 당신의 파이프라인을 예시로 들기 시작한다.',
      },
      {
        grade: 'hotfix',
        title: '남는 나사의 계절',
        teaser: '주문은 나간다. 다만 신제품이 올 때마다 if가 하나씩 늘고, 그 정확한 개수를 아는 사람은 조직에서 당신뿐이다.',
      },
      {
        grade: 'dawn',
        title: '옷장이 책장으로 출고된 날',
        teaser: '미지의 제품 타입이 표준 재단을 타고 조용히 출고되고, 새벽의 공장 앞마당에 반품 트럭이 줄을 선다.',
      },
      {
        grade: 'hidden',
        title: '???',
        teaser: '이 결말의 존재는 생산관리 팀장님만 알고 있습니다. 조건은 비공개입니다.',
      },
    ],
  },

  // =========================================================================
  // Mission 3 — Stage 4 "레거시 길들이기" / 대중교통 사내 시스템 / 기능 추가
  // =========================================================================
  {
    id: 's4-transit-01',
    stage: 4,
    stageTitle: '레거시 길들이기',
    missionType: '기능 추가',
    difficulty: 'Hard',
    scope: '단일 파일',
    modes: ['developer'],
    providedFiles: [],
    domain: '대중교통 사내 시스템',
    domainEmoji: '🚌',
    title: '30년 묵은 요금 계산기에 조조할인 넣기',
    estimatedMinutes: 180,
    briefing: {
      title: '카드 한 번 찍는 데 숨어 있는 정산의 세계',
      content: `### 환승할인은 공짜가 아니다

수도권에서 버스를 타고 지하철로 갈아탈 때 요금이 이어지는 **수도권 통합환승할인**은 2004년 서울 대중교통 개편에서 시작해 2007년 경기 버스, 2009년 인천으로 확대된 제도입니다. 요금 구조는 **통합 거리비례제**: 기본요금으로 10km까지 가고, 이후 5km마다 100원씩 추가됩니다. 환승은 하차 태그 후 30분 이내(밤 9시부터 다음 날 오전 7시까지는 60분)에 인정되며, 최대 4회까지 가능합니다. 하차 태그를 잊으면 다음 승차 때 페널티가 붙는 것도 이 구조 때문입니다.

### 할인은 누가 메워 주나 — 기관 간 정산

승객이 덜 낸 환승할인액은 누군가 부담해야 합니다. 그래서 서울교통공사, 코레일, 버스조합, 마을버스 사업자, 지자체가 **이용 실적 데이터를 기반으로 매달 수입금을 나누는 정산**을 합니다. 정산 배분 비율을 두고 기관 간 분쟁이 법정까지 간 사례도 있을 만큼 민감한 돈 문제라, 요금 계산 로직의 원 단위 오차도 그대로 정산 분쟁이 됩니다. 참고로 서울시는 2015년부터 첫차 출발부터 오전 6시 30분까지 교통카드로 승차하면 기본요금의 20%를 깎아 주는 **조조할인**을 시행 중입니다.

### 왜 이런 시스템은 수십 년 묵은 레거시가 될까

요금 제도는 폐기되지 않고 **누적**됩니다. 90년대 현금·토큰 시절 로직 위에 교통카드, 환승할인, 거리비례, 심야 할증, 조조할인이 겹겹이 쌓이죠. 게다가 "검증된 정산 결과"가 곧 시스템의 신뢰이기 때문에, 잘 도는 코드를 다시 짜자는 말은 "수백억 원 정산을 다시 검증하자"는 말과 같아 아무도 꺼내지 못합니다. 그렇게 아무도 전체를 이해하지 못하는 코드가 오늘도 수천만 건의 태그를 처리합니다. 이번 미션에서 여러분이 마주할 코드가 바로 그런 물건입니다.`,
    },
    scenario: `우리 회사는 지방 중소도시의 **버스 요금 정산 시스템**을 20년째 유지보수하고 있습니다. 시청에서 내년 1월부터 **조조할인 제도**를 도입한다는 공문이 내려왔습니다. 문제는 요금 계산의 심장인 \`FareCalc.java\`를 만든 사람이 모두 퇴사했고, 이 코드의 계산 결과로 매달 버스 회사들끼리 수억 원을 정산한다는 점입니다. 부장님의 지시는 단 하나: **"기존 요금은 1원도 달라지면 안 된다."**`,
    legacyFiles: [
      {
        path: 'src/main/java/fare/FareCalc.java',
        content: `package fare;

// ---------------------------------------------------------------
//  요금계산 모듈 FareCalc  v0.7
//  최초작성 19961112 전산실 이주임
//  19990602 요금동결 반영 (김부장)
//  20040701 환승할인 1차 적용 (외주 S정보기술)
//  20111219 심야버스 추가. doIt 손대지 말것. 정산검증 끝난 코드임
// ---------------------------------------------------------------
public class FareCalc {

    public static int FLAG9 = 0;        // 1 = 환승 진행중
    public static int a1 = 0;           // 누적 이동거리(m)
    public static int tmp2 = -1;        // 직전 하차시각 HHMM
    public static int cnt = 0;          // 이번 통행 승차횟수
    public static int m0 = -1;          // 직전 수단코드
    public static int[] buf = new int[16];   // 예비. 어디서 쓰는지 모름. 지우지 말것

    // mode 1=간선 2=지선 3=심야버스 4=마을버스
    // t = 승차시각 HHMM (예 0732)   d = 이번구간 거리(m)
    // cd 1=교통카드 0=현금
    // 리턴 = 이번 태그 청구액(원)
    public static int doIt(int mode, int t, int d, int cd) {
        int f = 0;
        int base = 0;

        if (mode == 1) {
            if (cd == 1) {
                base = 1500;
            } else {
                base = 1600;
            }
        } else {
            if (mode == 2) {
                if (cd == 1) {
                    base = 1450;
                } else {
                    base = 1550;
                }
            } else {
                if (mode == 3) {
                    if (cd == 1) {
                        base = 2500;
                    } else {
                        base = 2600;
                    }
                } else {
                    if (mode == 4) {
                        if (cd == 1) {
                            base = 1250;
                        } else {
                            base = 1300;
                        }
                    } else {
                        base = 1500;   // ????? 모르는 코드는 일단 간선 (20011023)
                    }
                }
            }
        }

        // 19970304 김부장 수정 - 학생토큰 폐지. 아래 절대 살리지 말것
        // if (cd == 2) { f = f - 100; }
        // if (cd == 3) { f = f / 2; }

        if (cd == 1) {
            if (FLAG9 == 1) {
                if (cnt < 5) {
                    if (tmp2 >= 0) {
                        int gap = t - tmp2;   // HHMM 뺄셈. 20040701 외주가 이렇게 함. 웬만하면 맞음
                        int lim = 30;
                        if (t >= 2100 || t <= 700) {
                            lim = 60;   // 20030811 밤에는 60분 (운영팀 요청)
                        }
                        if (gap >= 0 && gap <= lim) {
                            a1 = a1 + d;
                            if (a1 > 10000) {
                                int over = a1 - 10000;
                                int u = over / 5000;
                                if (over % 5000 > 0) {
                                    u = u + 1;
                                }
                                f = u * 100;
                                // 이미 낸 추가요금 차감
                                int over2 = (a1 - d) - 10000;
                                if (over2 > 0) {
                                    int u2 = over2 / 5000;
                                    if (over2 % 5000 > 0) {
                                        u2 = u2 + 1;
                                    }
                                    f = f - u2 * 100;
                                }
                            } else {
                                f = 0;   // 환승 기본요금 면제
                            }
                            cnt = cnt + 1;
                            m0 = mode;
                            return f;
                        } else {
                            FLAG9 = 0;   // 시간초과. 새 통행
                        }
                    } else {
                        FLAG9 = 0;
                    }
                } else {
                    FLAG9 = 0;   // 환승 4회 초과
                }
            }
        }

        // ---- 신규 통행 시작 ----
        FLAG9 = 0;
        a1 = d;
        cnt = 1;
        m0 = mode;
        f = base;
        if (a1 > 10000) {
            int over = a1 - 10000;
            int u = over / 5000;
            if (over % 5000 > 0) {
                u = u + 1;
            }
            f = f + u * 100;
        }
        if (cd == 1) {
            FLAG9 = 1;   // 카드면 환승 대기상태 진입
        }

        // 20111219 심야 할증 - 위에서 base에 이미 반영했는데 왜 여기 또 있는지 모름. 지우면 금액 틀어짐
        if (mode == 3) {
            if (t >= 0 && t < 400) {
                f = f + 0;   // tmp. 나중에 심야심화할증 들어올 자리 (박과장)
            }
        }

        return f;
    }

    // 하차 태그 처리
    public static void getOff(int t, int d) {
        a1 = a1 + d;
        tmp2 = t;
        // 19981120 하차태그 미실시 노선 예외처리
        // if (route >= 900) { tmp2 = -1; }   컴파일 안됨. 20050214 주석처리 (최대리)
    }

    // 일마감 초기화. 새벽 배치가 호출함
    public static void doIt2() {
        FLAG9 = 0;
        a1 = 0;
        tmp2 = -1;
        cnt = 0;
        m0 = -1;
        for (int i = 0; i < buf.length; i++) {
            buf[i] = 0;
        }
    }

    // 20060330 요금표 출력용. 영업소에서 아직 쓴다고 함
    public static String dump(int mode, int cd) {
        int keep1 = FLAG9;
        int keep2 = a1;
        int keep3 = tmp2;
        int keep4 = cnt;
        int keep5 = m0;
        doIt2();
        int v = doIt(mode, 1200, 5000, cd);
        FLAG9 = keep1;
        a1 = keep2;
        tmp2 = keep3;
        cnt = keep4;
        m0 = keep5;
        return "MODE" + mode + "/CD" + cd + "=" + v + "WON";
    }
}`,
      },
    ],
    requirements: [
      '시청 공문: 내년 1월 1일부터 교통카드 승차에 한해 조조할인을 시행합니다. 이른 아침에 승차하는 승객에게 기본요금의 20%를 감면해 주세요. (공문에는 "첫차 이후 이른 아침 시간대"라고만 적혀 있고 정확한 종료 시각은 명시되어 있지 않습니다)',
      '조조할인 시행 이후에도, 조조 시간대가 아닌 모든 승차의 요금은 현재 시스템과 1원도 다르지 않아야 합니다. 정산팀이 감사에 쓸 수 있는 근거(자동화된 검증)를 남겨 주세요.',
      '환승 거리비례 추가요금은 할인 대상이 아닙니다. 감면은 기본요금에만 적용됩니다.',
      '현금 승차는 조조할인 대상이 아닙니다.',
      '이번 작업에서 전면 재작성은 금지입니다. 다만 다음 요금 개편(정기권 도입 예정)을 위해, 이번에 손댄 부분만큼은 테스트 가능한 구조로 남겨 주세요.',
      '수정 범위와 이유를 정산팀 비개발자가 읽을 수 있는 변경 요약으로 정리해 주세요.',
    ],
    constraints: [
      '도메인 규칙: 조조할인과 환승 할인은 중복 적용됩니다. 단, 환승으로 기본요금이 이미 면제된 태그(청구액 0원)에는 감면할 금액 자체가 없습니다.',
      '도메인 규칙: 심야버스(mode 3)는 운행 특성상 조조할인 대상에서 제외됩니다.',
      'doIt()의 공개 시그니처와 static 진입 방식은 단말기 연동 모듈이 호출 중이므로 바꿀 수 없습니다.',
      '기존 코드의 주석(수정 이력)은 삭제하지 말고 보존하세요. 감사 대응 자료입니다.',
      '권장 소요시간은 180분입니다. 참고로 1996년에는 이 파일에 한 줄 추가하는 데 결재 도장 4개가 필요했습니다.',
    ],
    learningGoals: [
      '수정하기 전에 특성화 테스트(characterization test)로 현재 동작을 그물처럼 고정하는 기법 체득',
      '전역 가변 상태(static 필드)가 테스트를 어떻게 방해하는지 겪고, 초기화 지점을 통제하는 방법 익히기',
      '레거시를 전면 수술하지 않고 심(seam)을 찾아 최소 침습으로 기능을 끼워 넣는 판단력',
      '이해 못 한 코드(죽은 주석, 수수께끼 필드)를 "일단 건드리지 않는" 절제와, 그것을 리스크로 문서화하는 습관',
    ],
    hints: [
      '코드를 고치고 싶은 충동을 참고, 먼저 doIt()에 다양한 입력을 넣어 현재 출력을 표로 받아 적어 보세요. 그 표가 그대로 테스트가 됩니다. (doIt2()가 상태 초기화 지점이라는 것이 큰 선물입니다)',
      '경계값을 특히 촘촘히: 거리 10000m 전후, 환승 30/60분 경계, 환승 5회째, 자정을 넘는 시각. HHMM 뺄셈(t - tmp2)이 수학적으로 이상해도, 그 이상함까지가 "보존해야 할 현재 동작"입니다. 김부장님은 떠난 지 오래지만, 그의 주석은 아직 현역입니다.',
      '조조할인이 끼어들 심(seam)은 "base가 확정되는 순간"입니다. base 계산 직후 한 곳에서 감면하면 환승 로직을 통과하는 f 계산을 건드리지 않을 수 있습니다. 감면 규칙 자체는 새 클래스로 빼서 그 부분만이라도 단위 테스트를 붙여 보세요.',
    ],
    hiddenCases: [
      {
        title: '21억 번째 단말기',
        description:
          '신형 단말기 시리얼 체계가 팽창해 설비 ID가 int 최대값(약 21억)을 넘는 순간 32비트 정수는 음수로 뒤집힙니다. 2014년 유튜브는 강남스타일 조회수가 21억을 돌파하자 카운터를 64비트로 바꿨고, 2038년에는 32비트 유닉스 시간이 같은 벽에 부딪힙니다. 좋은 방어: 외부에서 오는 식별자는 수 연산이 필요 없으므로 애초에 문자열로 다루고, 입력 계층에서 범위·형식을 검증해 경계에서 명시적으로 거부하세요.',
      },
      {
        title: '자정을 넘는 환승',
        description:
          '23:50 하차 후 00:20 환승이면 t - tmp2 = 20 - 2350 = 음수가 되어 환승이 조용히 끊깁니다. HHMM 뺄셈의 태생적 결함이지만, 이것이 "현재 동작"이라면 특성화 테스트로 먼저 고정하는 것이 순서입니다. 좋은 방어: 현재 동작을 테스트로 못박은 뒤, 시간 계산을 분 단위 경과시간 같은 명시적 도메인 개념으로 감싸는 개선을 다음 개편 안건으로 문서화하세요. 말없이 고치는 것은 정산 사고입니다.',
      },
      {
        title: '마이너스 요금 버스',
        description:
          '조조할인 20%와 환승 거리비례 차감이 겹치는 경계에서 계산 순서를 잘못 끼우면 청구액이 음수가 될 수 있습니다. 음수 요금을 단말기가 어떻게 처리할지는 아무도 모릅니다(그게 제일 무섭습니다). 좋은 방어: 최종 반환 직전 "요금은 0원 이상" 불변식을 검증하고, 위반 시 조용히 0으로 보정하지 말고 기록을 남겨 정산팀이 볼 수 있게 하세요.',
      },
    ],
    rubric: [
      {
        name: '특성화 테스트',
        description: '수정 전에 기존 동작을 고정하는 테스트를 작성했는가. 경계값(거리·시간·환승 횟수)과 전역 상태 초기화가 다뤄졌는가.',
        weight: 30,
        visibleToLearner: true,
      },
      {
        name: '기존 동작 보존',
        description: '조조 시간대 외 모든 케이스에서 변경 전후 결과가 일치하는가. 일치를 테스트로 증명했는가.',
        weight: 25,
        visibleToLearner: true,
      },
      {
        name: '심(seam)을 통한 최소 침습 변경',
        description: '변경 지점이 좁고 명확한가. 이해하지 못한 코드를 불필요하게 건드리지 않았는가. 새 로직이 테스트 가능한 단위로 분리되었는가.',
        weight: 20,
        visibleToLearner: true,
      },
      {
        name: '조조할인 규칙의 정확성',
        description: '카드 전용, 기본요금만 감면, 심야버스 제외, 환승 면제 태그 처리 등 도메인 규칙이 정확히 구현되었는가.',
        weight: 15,
        visibleToLearner: true,
      },
      {
        name: '리스크 식별과 되묻기',
        description: '"이른 아침"의 종료 시각처럼 미정의된 요구를 질문으로 되돌렸는가. 수수께끼 코드(buf, 심야 중복 주석 등)를 리스크로 문서화했는가.',
        weight: 10,
        visibleToLearner: false,
      },
    ],
    explainTask: {
      audience: '버스운송사업조합 정산 담당 실무자 (20년차 비개발자, 요금 제도는 훤히 꿰고 있음)',
      prompt:
        '조조할인 반영 작업을 정산 담당자에게 보고하는 상황입니다. 설명할 것: (1) 왜 코드를 고치기 전에 "지금 요금표를 통째로 사진 찍는 작업"(특성화 테스트)부터 했는지, (2) 기존 요금이 1원도 안 변한다는 것을 어떻게 보장하는지, (3) 남아 있는 리스크(정확한 종료 시각 미확정 등)가 무엇이고 정산팀의 어떤 결정이 필요한지. 기술 용어 없이, 정산 감사에 대응하는 언어로 설명하세요.',
    },
    endings: [
      {
        grade: 'calm',
        title: '정산서가 조용한 달',
        teaser: '조조할인이 켜진 첫 달, 정산 금액은 예측과 원 단위까지 일치한다. 아무도 회의를 소집하지 않고, 그것이 이 업계 최고의 찬사다.',
      },
      {
        grade: 'hotfix',
        title: '엑셀로 메우는 오차',
        teaser: '대체로 맞는다. 다만 월말마다 정산팀이 몇 건을 수작업으로 보정하고, 그 목록이 매달 당신의 메일함에 도착한다.',
      },
      {
        grade: 'dawn',
        title: '김부장의 유산',
        teaser: '건드리지 말라던 블럭이 무너진 새벽 3시, 버스 회사 세 곳의 정산 담당자가 동시에 전화를 건다. 사후 보고서에 당신의 커밋이 인용된다.',
      },
      {
        grade: 'hidden',
        title: '???',
        teaser: '1996년 이 파일이 태어난 이래 아무도 도달하지 못한 결말입니다. 조건은 비공개입니다.',
      },
    ],
  },

  // =========================================================================
  // Mission 4 — Stage 3 "의존성 역전" / 금융 / 도메인 로직 구현
  // =========================================================================
  {
    id: 's3-interest-01',
    stage: 3,
    stageTitle: '의존성 역전',
    missionType: '도메인 로직 구현',
    difficulty: 'Normal',
    scope: '여러 파일',
    modes: ['developer'],
    domain: '금융',
    domainEmoji: '💱',
    title: '적금 만기 해지 계산기 — 규칙을 코드로 번역하라',
    estimatedMinutes: 150,
    briefing: {
      title: '"연 3.6%"에 속지 않는 법 — 적금 이자의 진실',
      content: `### 기대의 절반만 나오는 이유

정기적금은 매달 일정액을 붓고 만기에 원금과 이자를 받는 상품입니다. 그런데 월 30만 원씩 연 3.6% 적금에 넣은 사람이 만기에 받는 세전이자는 원금 360만 원의 3.6%인 129,600원이 아니라 **70,200원**, 기대의 거의 절반입니다. 은행이 속인 게 아닙니다. 금리는 "돈이 은행에 머문 기간"에 붙는데, 첫 달 납입금은 12개월을 온전히 머물지만 마지막 달 납입금은 딱 1개월만 머뭅니다. 그래서 정기적금 단리 세전이자는 회차별로 **월납입액 × 연이율 × (남은 개월 수 ÷ 12)** 를 모두 더한 값이고, 12개월짜리면 (12+11+…+1)/12 = 6.5개월치 이자만 나옵니다.

### 단리와 월복리 — 이자가 이자를 낳을 때

단리는 원금에만 이자가 붙습니다. 월복리는 매달 붙은 이자가 다음 달 원금에 합쳐져 **이자에 다시 이자**가 붙습니다. 1년짜리 저금리 적금에서는 차이가 몇백 원 수준이지만, 기간이 길어지고 금리가 높아질수록 격차는 기하급수적으로 벌어집니다.

### 통장에 찍히기 전에 떼어 가는 세금

이자에는 **이자소득세 15.4%** 가 붙습니다. 구성은 소득세 14% + 지방소득세 1.4%(소득세의 10%)이고, 은행이 이자를 지급하는 순간 **원천징수**하므로 통장에는 처음부터 세후 금액이 찍힙니다.

### 세금을 안 떼는 통장도 있다

만 65세 이상 고령자, 장애인 등 요건을 충족하면 전 금융기관 합산 원금 5,000만 원 한도로 이자소득세가 면제되는 **비과세종합저축**에 가입할 수 있습니다. 같은 상품, 같은 금리라도 가입자에 따라 실수령액이 달라지는 이유입니다.

### 이번 미션의 핵심

이번에는 고칠 레거시가 없습니다. 위 규칙을 **정확하게 코드로 번역**하는 것이 절반, 그 규칙(도메인)과 저장 기술(인프라) 사이의 **의존 방향을 어디로 둘 것인가**가 나머지 절반입니다.`,
    },
    scenario: `사내 복지 포털에 **적금 만기 계산기**를 새로 넣기로 했습니다. 인사팀이 제휴 은행 상품을 등록하면 직원이 세후 만기 수령액을 미리 확인하는 기능입니다. 저장은 당분간 전산팀이 제공한 인메모리 엔진(MapDb)을 쓰지만, **내년에 사내 표준 DB로 교체가 확정**되어 있습니다. 계산이 틀리면 "은행 앱이랑 숫자가 달라요"라는 민원이 곧바로 인사팀에 꽂힙니다.`,
    providedFiles: [
      {
        path: 'src/main/java/com/daehan/fin/engine/MapDb.java',
        content: `package com.daehan.fin.engine;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 초소형 인메모리 저장소.
 * 이 파일은 엔진입니다. 그대로 사용하세요. 수정/재구현 대상이 아닙니다.
 */
public class MapDb {

    private final Map<String, Map<String, Map<String, Object>>> tables = new HashMap<>();
    private int seq = 0;

    /** 행을 저장하고 생성된 id를 돌려준다. */
    public String insert(String table, Map<String, Object> row) {
        seq++;
        String id = table + "-" + seq;
        tables.computeIfAbsent(table, k -> new LinkedHashMap<>()).put(id, new HashMap<>(row));
        return id;
    }

    public List<Map<String, Object>> findAll(String table) {
        return new ArrayList<>(tables.getOrDefault(table, Map.of()).values());
    }

    public Map<String, Object> findById(String table, String id) {
        return tables.getOrDefault(table, Map.of()).get(id);
    }
}`,
      },
      {
        path: 'src/main/java/com/daehan/fin/App.java',
        content: `package com.daehan.fin;

import com.daehan.fin.engine.MapDb;

import java.util.Map;

/**
 * 실행 진입점. 이 파일은 엔진입니다. 그대로 사용하세요.
 * 구현이 끝나면 아래 주석의 기대 출력과 숫자가 정확히 일치해야 합니다.
 */
public class App {

    public static void main(String[] args) {
        MapDb db = new MapDb();

        String p1 = db.insert("savings", Map.of(
                "name", "직장인 첫걸음 적금",
                "monthlyDeposit", 300000,
                "months", 12,
                "annualRate", 0.036,
                "taxExempt", false));

        String p2 = db.insert("savings", Map.of(
                "name", "부모님 비과세 적금",
                "monthlyDeposit", 500000,
                "months", 24,
                "annualRate", 0.042,
                "taxExempt", true));

        // TODO(학습자): 여러분이 설계한 저장소 경계에 MapDb를 연결하고,
        //               MaturityService로 두 상품을 정산해 출력하세요.
        // MaturityService service = ...;
        // System.out.println(service.settle(p1));
        // System.out.println(service.settle(p2));

        // ===== 기대 출력 1: p1 (일반과세) =====
        // [직장인 첫걸음 적금] 만기 해지 정산
        // 원금합계: 3,600,000원
        // 세전이자(단리): 70,200원
        // (참고) 월복리였다면: 70,978원
        // 소득세(14%): 9,828원 / 지방소득세(1.4%): 982원 / 총세금: 10,810원
        // 세후이자: 59,390원
        // 만기수령액: 3,659,390원

        // ===== 기대 출력 2: p2 (비과세종합저축) =====
        // [부모님 비과세 적금] 만기 해지 정산
        // 원금합계: 12,000,000원
        // 세전이자(단리): 525,000원
        // (참고) 월복리였다면: 539,362원
        // 총세금: 0원 (비과세종합저축)
        // 세후이자: 525,000원
        // 만기수령액: 12,525,000원
    }
}`,
      },
    ],
    legacyFiles: [
      {
        path: 'src/main/java/com/daehan/fin/domain/SavingsProduct.java',
        content: `package com.daehan.fin.domain;

/** 적금 계약 정보 (완성된 코드 — 그대로 사용) */
public record SavingsProduct(
        String id,
        String name,
        int monthlyDeposit,    // 월 납입액(원)
        int months,            // 계약 개월 수
        double annualRate,     // 연이율 (0.036 = 연 3.6%)
        boolean taxExempt      // true = 비과세종합저축
) {
}`,
      },
      {
        path: 'src/main/java/com/daehan/fin/domain/InterestCalculator.java',
        content: `package com.daehan.fin.domain;

/**
 * 이자 계산기 (구현 대상).
 * 브리핑의 금융 규칙을 그대로 번역하세요.
 * 주의: 이 클래스는 저장 기술을 몰라야 합니다.
 */
public class InterestCalculator {

    /** 단리 세전이자(원). 회차별 이자 합산 후 원단위 절사. */
    public long simplePreTaxInterest(SavingsProduct product) {
        // TODO 구현
        throw new UnsupportedOperationException("아직 구현되지 않았습니다");
    }

    /** 월복리 세전이자(원). 회차별 원리금 계산, 합산 후 원단위 절사. */
    public long compoundPreTaxInterest(SavingsProduct product) {
        // TODO 구현
        throw new UnsupportedOperationException("아직 구현되지 않았습니다");
    }
}`,
      },
      {
        path: 'src/main/java/com/daehan/fin/domain/MaturityService.java',
        content: `package com.daehan.fin.domain;

/**
 * 만기 해지 정산 서비스 (구현 대상).
 *
 * 상품 조회가 필요하지만, 이 클래스가 MapDb를 직접 알아서는 안 됩니다.
 * 그 사이에 어떤 경계를 둘지는 여러분이 설계합니다.
 * (경계용 인터페이스는 일부러 제공하지 않았습니다.)
 */
public class MaturityService {

    // TODO 생성자에서 무엇을 주입받을지 설계하세요.

    /** 만기 해지 정산 요약. App.java의 기대 출력 형식과 일치해야 합니다. */
    public String settle(String productId) {
        // TODO 구현
        throw new UnsupportedOperationException("아직 구현되지 않았습니다");
    }
}`,
      },
    ],
    requirements: [
      '검증 시나리오 1(일반과세): 월 300,000원 × 12개월, 연 3.60% 단리. 세전이자 = 300,000 × 0.036 × (12+11+…+1)/12 = 300,000 × 0.036 × 78/12 = 70,200원. 소득세 = 70,200 × 14% = 9,828원, 지방소득세 = 70,200 × 1.4% = 982.8 → 982원(절사). 총세금 10,810원, 세후이자 59,390원, 만기수령액 3,659,390원. App.java의 기대 출력과 정확히 일치해야 합니다.',
      '고객 안내용으로 월복리였다면 얼마였을지 참고치를 함께 보여 줍니다. 계산: 회차별 월납입액 × ((1 + 연이율/12)^남은개월 − 1)을 합산한 뒤 원단위 절사. 시나리오 1은 70,978원, 시나리오 2는 539,362원이 나와야 합니다.',
      '비과세종합저축 가입 직원(taxExempt)은 세율 0%입니다. 검증 시나리오 2: 월 500,000원 × 24개월, 연 4.20% 단리 → 세전이자 = 500,000 × 0.042 × (24+23+…+1)/12 = 500,000 × 0.042 × 300/12 = 525,000원 = 세후이자, 만기수령액 12,525,000원.',
      '원단위 처리 규칙: 세전이자는 합산 후 원단위 절사, 소득세와 지방소득세는 각각 원단위 절사 후 합산합니다. 임의 반올림은 은행 앱과 숫자가 달라지는 민원의 원인이 됩니다.',
      '내년 사내 표준 DB 교체가 확정되어 있고, 인사팀 감사 대비로 이자 계산·만기 정산 로직의 단위 테스트는 DB 없이(순수 자바 객체만으로) 돌아야 합니다. 저장은 MapDb를 쓰되, 계산·정산 코드에 MapDb라는 이름이 등장해서는 안 됩니다.',
      '콜센터에 중도해지 예상액 문의가 많아 다음 버전에 넣을 예정입니다. 다만 중도해지 적용 이율표는 상품팀에서 아직 전달받지 못했습니다.',
    ],
    constraints: [
      'MapDb.java와 App.java는 엔진 코드입니다. 수정·재구현 금지, 그대로 사용하세요.',
      '금액은 정수(원)로 다루고, 명시된 절사 규칙 외의 임의 반올림을 금지합니다.',
      '도메인 규칙: 이자소득세 15.4% = 소득세 14% + 지방소득세 1.4%(소득세의 10%). 두 세목은 각각 절사합니다.',
      '외부 라이브러리 없이 순수 Java 17로 작성합니다.',
      '은행 앱과 1원이라도 다르면 민원은 인사팀으로 가지만, 원인 분석 요청은 당신에게 옵니다.',
    ],
    learningGoals: [
      '의존성 역전: 인터페이스를 "사용하는 쪽(도메인)"이 정의하고 소유하며, 인프라 구현이 그 계약을 따라오게 만드는 경험',
      '저장소 경계(repository 인터페이스)를 스스로 설계하고, 도메인 패키지에서 인프라 방향의 import를 0개로 유지하기',
      '순수 계산 로직을 DB 없이 단위 테스트하는 구조 만들기',
      '브리핑으로 학습한 도메인 지식(금융 규칙)을 오차 없이 코드로 번역하는 훈련',
    ],
    hints: [
      '계산 규칙은 브리핑에 전부 있습니다. 코드를 열기 전에 "각 회차의 돈이 은행에 몇 개월 머무는가" 표를 손으로 먼저 만들어 보세요. 시나리오 1의 70,200원이 손으로 재현되면 절반은 끝났습니다.',
      'InterestCalculator 파일 상단에 import com.daehan.fin.engine.MapDb가 나타나는 순간 "DB 없이 테스트" 요구는 실패합니다. 계산기는 SavingsProduct만 받으면 됩니다. 데이터를 꺼내 오는 일은 다른 누군가의 책임입니다.',
      '도메인 패키지에 SavingsProductRepository 같은 인터페이스를 직접 정의하고(findById 하나면 충분할지도), MapDb를 감싸는 구현체는 바깥(infra) 패키지에 두세요. 의존 화살표가 인프라 → 도메인으로 향하게 되었다면, 그것이 의존성 역전입니다.',
    ],
    hiddenCases: [
      {
        title: '0개월짜리 적금',
        description:
          '개월 수 0 또는 월납입 0원인 계약이 들어오면 합산 루프가 그냥 0을 돌려주고, 화면에는 "만기수령액 0원"이 정상처럼 표시됩니다. 좋은 방어: 도메인 진입 시점에 계약 유효성(개월 ≥ 1, 납입액 > 0)을 검증하고 위반이면 명시적으로 실패하세요. 계산기가 침묵하면 민원이 대신 말합니다.',
      },
      {
        title: 'taxExempt: "Y"',
        description:
          'MapDb는 아무 Object나 저장하므로 boolean 자리에 문자열 "Y"가 들어올 수 있습니다. (Boolean) 캐스팅은 터지고, Boolean.parseBoolean 방식은 조용히 false가 되어 비과세 고객에게 세금을 뗍니다. 둘 다 사고입니다. 좋은 방어: 인프라 어댑터(경계)에서 타입을 검증·변환해 도메인에는 깨끗한 SavingsProduct만 들여보내고, 변환할 수 없는 행은 명시적으로 거부하세요.',
      },
      {
        title: '3.6인가 0.036인가',
        description:
          '연이율 자리에 퍼센트 값 3.6이 들어오면 이자가 100배로 계산됩니다. 1999년 화성 기후 궤도선(Mars Climate Orbiter)은 한 팀은 파운드힘, 한 팀은 뉴턴 단위로 계산한 탓에 3억 달러짜리 탐사선을 잃었습니다 — 단위 혼동은 우주급 사고입니다. 좋은 방어: 이름에 단위를 박고(예: annualRateFraction), 경계에서 범위를 검증해(0.5를 넘으면 퍼센트 입력 의심) 명시적으로 거부하세요.',
      },
    ],
    rubric: [
      {
        name: '도메인 규칙 정확성',
        description: '두 검증 시나리오의 기대 출력과 숫자가 정확히 일치하는가. 절사 규칙(세전이자 합산 절사, 세목별 각각 절사)이 정확한가.',
        weight: 35,
        visibleToLearner: true,
      },
      {
        name: '인터페이스 경계 설계',
        description: '저장소 인터페이스를 도메인 쪽에서 정의·소유했는가. 계약의 시그니처가 도메인의 필요만큼만 노출하는가.',
        weight: 20,
        visibleToLearner: true,
      },
      {
        name: '계층 분리',
        description: '도메인(계산·정산) / 인프라(MapDb 어댑터) / 조립(App 연결)이 패키지 수준에서 구분되고, 의존 방향이 도메인을 향하는가.',
        weight: 15,
        visibleToLearner: true,
      },
      {
        name: '테스트',
        description: '이자 계산과 정산 로직의 단위 테스트가 MapDb 없이 도는가. 경계 케이스(1개월 계약, 비과세, 절사 발생 금액)를 다루는가.',
        weight: 20,
        visibleToLearner: true,
      },
      {
        name: '엔진 코드 오용 여부',
        description: '도메인 코드가 MapDb를 직접 참조하지 않는가. 엔진 코드를 수정하거나 재구현하지 않았는가.',
        weight: 10,
        visibleToLearner: false,
      },
    ],
    explainTask: {
      audience: '은퇴를 앞두고 적금 가입을 고민 중인 부모님 (금융 지식은 예금 통장 수준)',
      prompt:
        '부모님이 "연 3.6%라더니 왜 이것밖에 안 붙었냐"고 물으십니다. 설명할 것: (1) 왜 적금 이자가 기대의 절반쯤인지 — 매달 넣은 돈이 은행에 머문 기간이 다르다는 것을 숫자 예시로, (2) 통장에 찍히기 전에 떼는 세금 15.4%와, 부모님이 대상일 수 있는 비과세종합저축, (3) 마지막으로 이 계산기가 "계산하는 부분"과 "장부에서 꺼내 오는 부분"으로 나뉘어 있어 은행이 바뀌어도 계산은 그대로라는 것을 생활 비유 하나로. 표와 그림 없이 말로만, 부모님이 끊지 않고 따라올 수 있는 순서로.',
    },
    endings: [
      {
        grade: 'calm',
        title: '은행 앱과 같은 숫자',
        teaser: '직원들이 계산기를 믿기 시작한다. 인사팀에서 민원 대신 커피 기프티콘이 오고, DB 교체일에도 계산 코드는 한 줄도 열리지 않는다.',
      },
      {
        grade: 'hotfix',
        title: '1원의 왕복 메일',
        teaser: '거의 맞는다. 다만 분기마다 절사 어딘가에서 1원이 어긋나고, 그 1원의 출처를 추적하는 메일 스레드가 계절마다 부활한다.',
      },
      {
        grade: 'dawn',
        title: '비과세 고객에게 세금을 뗀 날',
        teaser: 'taxExempt가 소리 없이 false로 읽힌 아침, 65세 이상 가입자 명단을 든 감사팀이 도착한다. 원인 분석 요청은 물론 당신에게 온다.',
      },
      {
        grade: 'hidden',
        title: '???',
        teaser: '이 결말을 여는 열쇠는 아직 아무도 회수하지 못했습니다. 조건은 비공개입니다.',
      },
    ],
  },

  // =========================================================================
  // Mission 5 — Stage 1 "분리의 감각" / 제과·제빵 / 도메인 로직 구현
  // =========================================================================
  {
    id: 's1-bakery-01',
    stage: 1,
    stageTitle: '분리의 감각',
    missionType: '도메인 로직 구현',
    difficulty: 'Easy',
    scope: '단일 파일',
    modes: ['developer'],
    domain: '제과·제빵',
    domainEmoji: '🥖',
    title: '베이커스 퍼센트 레시피 스케일러 만들기',
    estimatedMinutes: 90,
    briefing: {
      title: '밀가루는 언제나 100 — 제빵사의 수학',
      content: `### 베이커스 퍼센트라는 발명

제빵사의 레시피에는 "물 680g"이 아니라 **"물 68%"** 라고 적혀 있습니다. 기준은 항상 밀가루입니다. 밀가루 전체를 100%로 놓고 나머지 재료를 밀가루 대비 비율로 적는 표기법이 **베이커스 퍼센트(baker's percentage)** 입니다. 밀가루를 두 종류 섞으면 그 합이 100%가 됩니다. 왜 이렇게 쓸까요? 비율만 있으면 반죽 1kg이든 300kg이든 즉시 환산되고, 다른 가게의 레시피와도 곧바로 비교할 수 있기 때문입니다. 전 세계 베이커리가 쓰는 사실상의 공용어죠.

### 수분율만 보면 빵의 정체가 보인다

물 ÷ 밀가루, 즉 **수분율(hydration)** 은 빵의 성격을 결정합니다. 쫄깃하고 결이 고운 식빵은 60~65%, 겉이 바삭한 바게트는 65~75%, 큼직한 기공이 뚫린 치아바타는 80%를 넘습니다. 숙련된 제빵사는 수분율 숫자 하나로 반죽의 질감과 다루기 난이도를 짐작합니다.

### 오븐은 물을 훔쳐 간다

반죽 350g을 구우면 350g짜리 빵이 나오지 않습니다. 굽는 동안 수분이 증발해 보통 **10% 안팎이 사라집니다(굽기 손실)**. 그래서 "350g 바게트 10개"라는 주문을 받으면 손실률로 나눠 반죽량을 역산해야 합니다.

### 이스트와 시간은 교환 가능하다

이스트를 많이 넣으면 빨리 부풀고, 줄이면 천천히 부풀며 풍미가 깊어집니다. 그래서 냉장고에서 밤새 발효시키는 저온 장시간 발효 레시피는 이스트를 절반 이하로 줄입니다.

### 곁들이는 상식

프랑스는 1993년 이른바 **빵 법령(décret pain)** 으로 "전통 바게트"를 자처하려면 밀가루·물·소금·효모만 쓰고 냉동 생지를 쓰지 말라고 법으로 정했습니다. 레시피가 곧 규정이 되는 세계 — 그 규정을 정확한 계산으로 옮기는 것이 이번 미션입니다.`,
    },
    scenario: `동네에서 잘되는 베이커리 사장님이 지인 소개로 일을 맡겨 왔습니다. 지금은 주문이 들어올 때마다 사장님이 **계산기를 두드려 반죽량과 재료를 역산**하는데, 새벽마다 하다 보니 실수가 잦답니다. "몇 그램짜리 몇 개"만 넣으면 재료 목록과 주문서가 나오는 프로그램을 원하십니다. 곧 매장 전광판과 모바일 앱에도 같은 계산 결과를 내보낼 계획이 있다고 합니다.`,
    providedFiles: [],
    legacyFiles: [
      {
        path: 'src/main/java/com/daehan/bakery/Recipe.java',
        content: `package com.daehan.bakery;

/** 베이커스 퍼센트로 표현한 레시피 (완성된 코드 — 그대로 사용) */
public record Recipe(
        String name,
        double hydrationPct,   // 수분율 (68.0 = 밀가루 대비 68%)
        double saltPct,        // 소금 비율
        double yeastPct        // 이스트 비율
) {

    /** 밀가루 100%를 포함한 총 베이커스 퍼센트 */
    public double totalPct() {
        return 100.0 + hydrationPct + saltPct + yeastPct;
    }
}`,
      },
      {
        path: 'src/main/java/com/daehan/bakery/RecipeScaler.java',
        content: `package com.daehan.bakery;

/**
 * 레시피 스케일러 (구현 대상).
 *
 * 메서드를 어떻게 나눌지는 여러분의 설계입니다.
 * 단, "계산"과 "화면에 보여줄 문장 만들기"가 한 메서드에 섞이면
 * 전광판·모바일 앱 등 출력처가 늘어날 때마다 계산 코드를 다시 열게 됩니다.
 */
public class RecipeScaler {

    /** 목표 개수 × 개당 완제품 중량과 굽기 손실률로 필요한 반죽량(g)을 구한다. */
    public int doughNeeded(int count, int unitWeightG, double lossRate) {
        // TODO 구현 (반올림 규칙은 요구사항 참조)
        throw new UnsupportedOperationException("아직 구현되지 않았습니다");
    }

    // TODO 재료량 역산과 주문서 출력을 어떤 단위로 나눌지 직접 설계하세요.
}`,
      },
    ],
    requirements: [
      '기준 환산 검증: 바게트 레시피(수분율 68%, 소금 2%, 이스트 1%)를 밀가루 1,000g 기준으로 환산하면 물 680g, 소금 20g, 이스트 10g, 반죽 총량 1,710g이 나와야 합니다.',
      '주문 역산 검증: "350g 바게트 10개" 주문, 굽기 손실률 10% → 필요 반죽 = 10 × 350 ÷ (1 − 0.10) = 3,888.9g → 그램 단위 올림으로 3,889g.',
      '재료 역산 규칙: 밀가루 = 필요 반죽량 ÷ (총 베이커스% ÷ 100)를 그램 반올림으로 먼저 확정하고, 나머지 재료는 확정된 밀가루량 × 각 비율을 그램 반올림합니다. 위 주문이면 밀가루 2,274g, 물 1,546g, 소금 45g, 이스트 23g. (반올림 때문에 재료 합계가 3,889g과 1~2g 어긋나는 것은 정상입니다)',
      '저온 장시간 발효 옵션을 켜면 이스트만 절반 비율로 계산합니다. 위 주문이면 이스트 11g.',
      '계산 결과는 지금은 매장 주문서 형식의 문자열로 출력하지만, 곧 전광판·모바일 앱 형식이 추가됩니다. 그때 계산 코드는 열어 보지 않아도 되게 해 주세요.',
      '사장님 요청: "반죽은 조금 넉넉하게 준비하고 싶어요." (여유분이 몇 %인지는 물어볼 때마다 대답이 다릅니다)',
    ],
    constraints: [
      '도메인 규칙: 모든 비율의 기준은 밀가루 100%입니다. 밀가루를 여러 종류 쓰면 그 합이 100%입니다.',
      '그램은 정수로 다루며, 요구사항에 명시된 올림/반올림 규칙 외의 임의 처리는 금지합니다.',
      '외부 라이브러리 없이 순수 Java 17로 작성합니다.',
      '반죽은 기다려 주지 않습니다. 발효는 당신의 회의 일정에 관심이 없습니다.',
    ],
    learningGoals: [
      '도메인 규칙(베이커스 퍼센트, 굽기 손실, 발효 옵션)을 정확한 계산 코드로 번역하는 훈련',
      '계산(순수 로직)과 표현(문자열 포맷팅)을 분리하는 첫 감각 익히기',
      '올림/반올림처럼 사소해 보이는 규칙도 요구사항의 일부임을 인식하기',
      '수분율, 손실률 같은 도메인 용어를 코드 네이밍에 그대로 살리기',
    ],
    hints: [
      '"필요 반죽량 계산", "그 반죽을 만들 재료 계산", "주문서 문장 만들기"는 서로 다른 질문입니다. 각각의 입력과 출력이 무엇인지 종이에 먼저 적어 보세요.',
      '반올림 규칙이 계산마다 다릅니다(반죽량은 올림, 재료는 반올림). 규칙이 다른 계산을 한 메서드에 욱여넣으면 반드시 헷갈립니다.',
      '계산 메서드는 숫자(또는 재료 목록 같은 작은 결과 객체)만 반환하게 하고, 문자열 조립은 별도 클래스(예: OrderSheetFormatter)에 맡기세요. 전광판이 추가되면 포맷터 하나만 늘어나는 구조가 정답에 가깝습니다.',
    ],
    hiddenCases: [
      {
        title: '밀가루 0g 레시피',
        description:
          '밀가루가 0이면 수분율의 분모가 0이 되고, 역산에서는 0 나눗셈·NaN이 조용히 주문서까지 번질 수 있습니다. 좋은 방어: 계산 진입 전에 "밀가루 > 0, 비율 ≥ 0" 검증 계층을 두고 위반 시 명시적으로 실패하세요. NaN이 찍힌 주문서는 새벽 3시의 사장님을 매우 슬프게 합니다.',
      },
      {
        title: '손실률 100%',
        description:
          '손실률이 1.0 이상이면 필요 반죽 = 주문량 ÷ (1 − 손실률)에서 0 나눗셈 또는 음수 반죽이 나옵니다. 굽는 동안 빵이 전부 증발하는 물리 현상은 아직 보고된 바 없으므로, 손실률은 0 이상 1 미만(현실적으로는 0.05~0.25)을 벗어나면 입력 단계에서 명시적으로 거부하는 것이 정답입니다.',
      },
      {
        title: '0개 주문',
        description:
          '수량 0이나 음수 주문이 들어오면 반죽 0g, 재료 0g의 "유령 주문서"가 정상 출력됩니다. 좋은 방어: 수량 ≥ 1 검증과 함께, 실패 사유를 호출자에게 명확한 메시지로 돌려주세요. 조용한 빈 주문서는 언젠가 진짜 주문을 삼킵니다.',
      },
    ],
    rubric: [
      {
        name: '도메인 규칙 정확성',
        description: '기준 환산·주문 역산·발효 옵션의 검증 숫자가 모두 일치하는가. 올림/반올림 규칙이 명시대로 구현되었는가.',
        weight: 35,
        visibleToLearner: true,
      },
      {
        name: '계산과 표현의 분리',
        description: '순수 계산과 문자열 포맷팅이 분리되어, 새 출력 형식 추가 시 계산 코드를 수정하지 않아도 되는가.',
        weight: 25,
        visibleToLearner: true,
      },
      {
        name: '도메인 타입화와 네이밍',
        description: '재료 목록 등 결과가 원시 타입 나열이 아니라 의미 있는 타입으로 표현되고, 수분율·손실률 같은 용어가 이름에 살아 있는가.',
        weight: 15,
        visibleToLearner: true,
      },
      {
        name: '테스트',
        description: '요구사항의 검증 숫자들이 단위 테스트로 고정되어 있는가. 반올림 경계가 다뤄졌는가.',
        weight: 15,
        visibleToLearner: true,
      },
      {
        name: '모호한 요구사항 확인',
        description: '"조금 넉넉하게"의 기준을 임의 확정하지 않고 질문했거나 가정을 명시했는가.',
        weight: 10,
        visibleToLearner: false,
      },
    ],
    explainTask: {
      audience: '홈베이킹에 갓 입문한 친구 (지금까지 계량컵으로 대충 계량하던 사람)',
      prompt:
        '친구에게 설명해 주세요. (1) 왜 제빵사는 컵이 아니라 그램과 퍼센트로 말하는지, (2) 수분율 숫자 하나가 빵에 대해 무엇을 알려주는지 — 식빵·바게트·치아바타 예시로, (3) "350g 바게트 10개" 주문이 어떤 단계를 거쳐 재료 목록으로 바뀌는지 순서대로. 마지막으로 여러분의 프로그램이 "계산하는 부분"과 "주문서를 예쁘게 쓰는 부분"으로 나뉜 이유를 요리에 빗대어(맛을 내는 일과 플레이팅이 다른 일이듯) 한 문장으로 정리하세요.',
    },
    endings: [
      {
        grade: 'calm',
        title: '새벽 4시의 정적',
        teaser: '사장님은 더 이상 계산기를 두드리지 않는다. 주문서는 반죽보다 먼저 완성되어 있고, 당신은 갓 구운 바게트를 정기적으로 받는다.',
      },
      {
        grade: 'hotfix',
        title: '가끔 틀리는 저울',
        teaser: '빵은 나온다. 다만 몇 그램씩 어긋나는 날이 있고, 사장님은 "감으로 보정했다"며 당신을 흘깃 본다.',
      },
      {
        grade: 'dawn',
        title: 'NaN 그램의 아침',
        teaser: '전광판에 "밀가루 NaN그램"이 표시된 채 개점하고, 그 사진이 동네 커뮤니티에서 당신보다 유명해진다.',
      },
      {
        grade: 'hidden',
        title: '???',
        teaser: '이 결말의 레시피는 아직 공개되지 않았습니다. 조건은 비공개입니다.',
      },
    ],
  },

  // =========================================================================
  // Mission 6 — Stage 2 "인터페이스는 계약" / 건축 / 도메인 로직 구현
  // =========================================================================
  {
    id: 's2-zoning-01',
    stage: 2,
    stageTitle: '인터페이스는 계약',
    missionType: '도메인 로직 구현',
    difficulty: 'Normal',
    scope: '여러 파일',
    modes: ['developer'],
    domain: '건축',
    domainEmoji: '🏗',
    title: '건폐율·용적률 — 건축 가능 규모 검토기',
    estimatedMinutes: 150,
    briefing: {
      title: '스카이라인은 두 개의 숫자로 조각된다',
      content: `### 건폐율과 용적률

같은 크기의 땅인데 어디에는 2층 상가가, 어디에는 40층 주상복합이 서는 이유는 **건폐율**과 **용적률**입니다. 건폐율 = 건축면적(하늘에서 내려다본 수평투영면적) ÷ 대지면적 × 100, 즉 "땅을 얼마나 **넓게** 덮을 수 있나"입니다. 용적률 = 지상층 연면적 합계 ÷ 대지면적 × 100, 즉 "얼마나 **높이** 쌓을 수 있나"입니다. 중요한 디테일: 용적률 산정용 연면적에서는 **지하층과 지상 부속주차장 면적이 빠집니다**. 같은 건물이라도 "전체 연면적"과 "용적률 산정용 연면적"이 다른 이유입니다.

### 용도지역이라는 게임 규칙

국토계획법은 땅을 용도지역으로 나누고 지역마다 상한을 둡니다. 이 미션에서 쓰는 예시 규정은 제1종일반주거 60%/150%, 제2종일반주거 60%/250%, 일반상업 80%/1300%입니다. 실제로는 법이 상한의 범위를 정하고 **지자체 조례**가 그 안에서 확정하기 때문에, 같은 "일반상업지역"이라도 도시마다 숫자가 다릅니다. 재건축 조합이 **종상향**에 사활을 거는 이유도 여기 있습니다. 2종에서 3종으로 한 단계만 올라가도 지을 수 있는 연면적, 곧 분양할 수 있는 면적이 수십 퍼센트 늘어나기 때문입니다.

### 1916년 뉴욕, 조닝의 탄생

1915년 맨해튼에 들어선 40층짜리 에퀴터블 빌딩이 주변 거리를 통째로 그늘에 가두자, 이듬해 뉴욕시는 세계 최초의 종합 조닝 조례를 만들어 일정 높이 이상은 벽면을 뒤로 물리도록(셋백) 강제했습니다. 웨딩케이크처럼 층층이 좁아지는 맨해튼 고전 마천루의 실루엣은 그 규정의 산물입니다. 도시의 모양은 우연이 아니라 규정의 결과이고, 규정은 끊임없이 바뀌고 늘어납니다 — 이번 미션에서 여러분의 코드가 감당해야 할 현실이 바로 그것입니다.`,
    },
    scenario: `부동산 개발 컨설팅 회사의 사내 도구를 만듭니다. 영업 담당자가 필지 주소와 면적, 용도지역만 넣으면 **최대 건축면적·최대 연면적·대략적인 최대 층수**를 바로 뽑아 고객 미팅에 들고 가는 검토기입니다. 지금은 세 개 용도지역만 다루지만, 컨설팅 지역이 넓어지면서 **다음 분기에만 준주거·자연녹지 등 네 개 지역이 추가**될 예정이고, 도시마다 조례 값이 달라 같은 지역이라도 숫자를 덮어써야 하는 경우가 있습니다.`,
    providedFiles: [
      {
        path: 'src/main/java/com/daehan/archi/engine/ParcelStore.java',
        content: `package com.daehan.archi.engine;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 초소형 인메모리 필지 저장소.
 * 이 파일은 엔진입니다. 그대로 사용하세요. 수정/재구현 대상이 아닙니다.
 */
public class ParcelStore {

    private final Map<String, Map<String, Object>> rows = new LinkedHashMap<>();
    private int seq = 0;

    /** 필지 행을 저장하고 생성된 id를 돌려준다. */
    public String insert(Map<String, Object> row) {
        seq++;
        String id = "parcel-" + seq;
        rows.put(id, new HashMap<>(row));
        return id;
    }

    public List<Map<String, Object>> findAll() {
        return new ArrayList<>(rows.values());
    }

    public Map<String, Object> findById(String id) {
        return rows.get(id);
    }
}`,
      },
      {
        path: 'src/main/java/com/daehan/archi/App.java',
        content: `package com.daehan.archi;

import com.daehan.archi.engine.ParcelStore;

import java.util.Map;

/**
 * 실행 진입점. 이 파일은 엔진입니다. 그대로 사용하세요.
 * 구현이 끝나면 아래 주석의 기대 출력과 숫자가 정확히 일치해야 합니다.
 */
public class App {

    public static void main(String[] args) {
        ParcelStore store = new ParcelStore();

        String p1 = store.insert(Map.of(
                "address", "대전시 유성구 학하동 123-4",
                "areaM2", 500.0,
                "zone", "제2종일반주거지역"));

        String p2 = store.insert(Map.of(
                "address", "대전시 중구 은행동 55-1",
                "areaM2", 400.0,
                "zone", "일반상업지역",
                "ordinanceFarPct", 800.0));   // 지자체 조례 용적률 제한

        // TODO(학습자): 여러분이 설계한 경계 뒤에 ParcelStore를 숨기고,
        //               ZoningService로 두 필지를 검토해 출력하세요.
        // ZoningService service = ...;
        // System.out.println(service.review(p1));
        // System.out.println(service.review(p2));

        // ===== 기대 출력 1: p1 =====
        // [건축 가능 규모 검토] 대전시 유성구 학하동 123-4
        // 용도지역: 제2종일반주거지역 (건폐율 60% / 용적률 250%)
        // 최대 건축면적: 300.0㎡
        // 최대 연면적(용적률 산정용, 지하층·부속주차장 제외): 1,250.0㎡
        // 예상 최대 층수(기준층 300.0㎡ 가정): 4층 (잔여 50.0㎡)

        // ===== 기대 출력 2: p2 (조례 오버라이드) =====
        // [건축 가능 규모 검토] 대전시 중구 은행동 55-1
        // 용도지역: 일반상업지역 (건폐율 80% / 용적률 1300% -> 조례 800% 적용)
        // 최대 건축면적: 320.0㎡
        // 최대 연면적(용적률 산정용, 지하층·부속주차장 제외): 3,200.0㎡
        // 예상 최대 층수(기준층 320.0㎡ 가정): 10층 (잔여 0.0㎡)
    }
}`,
      },
    ],
    legacyFiles: [
      {
        path: 'src/main/java/com/daehan/archi/domain/Parcel.java',
        content: `package com.daehan.archi.domain;

/**
 * 필지 정보 (완성된 코드 — 그대로 사용).
 * ordinanceFarPct는 지자체 조례 용적률 제한. 없으면 null.
 */
public record Parcel(
        String id,
        String address,
        double areaM2,
        String zone,
        Double ordinanceFarPct
) {
}`,
      },
      {
        path: 'src/main/java/com/daehan/archi/domain/ZoningService.java',
        content: `package com.daehan.archi.domain;

/**
 * 건축 가능 규모 검토 서비스 (구현 대상).
 *
 * 두 가지가 여러분의 설계 몫입니다.
 * 1) 용도지역별 규정을 어떻게 표현할 것인가 — 지역은 계속 늘어납니다.
 * 2) 필지를 어디서 가져올 것인가 — 이 클래스가 ParcelStore를 직접 알면 안 됩니다.
 * (경계용 인터페이스는 일부러 제공하지 않았습니다.)
 */
public class ZoningService {

    // TODO 생성자에서 무엇을 주입받을지 설계하세요.

    /** 검토 결과 요약. App.java의 기대 출력 형식과 일치해야 합니다. */
    public String review(String parcelId) {
        // TODO 구현
        throw new UnsupportedOperationException("아직 구현되지 않았습니다");
    }
}`,
      },
    ],
    requirements: [
      '검증 시나리오 1: 대지 500㎡, 제2종일반주거지역(건폐율 60% / 용적률 250%) → 최대 건축면적 = 500 × 0.6 = 300.0㎡, 최대 연면적 = 500 × 2.5 = 1,250.0㎡. 기준층을 최대 건축면적으로 가정하면 1,250 ÷ 300 = 4.17 → 4개층 + 잔여 50.0㎡. App.java의 기대 출력과 정확히 일치해야 합니다.',
      '필지에 지자체 조례 용적률이 지정되어 있으면 법정 상한 대신 조례 값을 적용합니다. 검증 시나리오 2: 대지 400㎡ 일반상업지역(80% / 1300%) + 조례 800% → 최대 건축면적 320.0㎡, 최대 연면적 3,200.0㎡, 기준층 320.0㎡ 가정 시 정확히 10층.',
      '다음 분기에 준주거·자연녹지 등 용도지역 네 개가 추가됩니다. 영업팀 요청: "새 지역이 추가될 때 기존 검토 코드를 고치는 게 아니라, 규정 하나만 등록하면 끝나면 좋겠어요."',
      '심의 대응 때문에 규정 계산 로직의 단위 테스트는 저장소 없이 돌아야 합니다. 저장은 ParcelStore를 쓰되, 검토·계산 코드가 ParcelStore를 직접 알아서는 안 됩니다. (내년에 부동산종합공부 API로 교체 예정)',
      '결과 문구에 연면적이 "용적률 산정용"(지하층·부속주차장 제외) 기준임을 반드시 명시해 주세요. 고객이 전체 연면적과 혼동해 분쟁이 난 적이 있습니다.',
      '현장에서 "한 필지가 두 용도지역에 걸쳐 있다"는 문의가 종종 옵니다. 걸침 필지의 처리 기준은 아직 법무 검토 중이라 전달받지 못했습니다.',
    ],
    constraints: [
      'ParcelStore.java와 App.java는 엔진 코드입니다. 수정·재구현 금지, 그대로 사용하세요.',
      '예시 규정 값(제1종일반주거 60%/150%, 제2종일반주거 60%/250%, 일반상업 80%/1300%)은 이 미션의 기준값입니다. 실제 상한은 법령이 범위를 정하고 지자체 조례가 확정하므로 도시마다 다르다는 점을 코드 주석에 명시하세요.',
      '면적은 소수 첫째 자리까지 표시합니다.',
      '외부 라이브러리 없이 순수 Java 17로 작성합니다.',
      '건축주의 꿈은 무한하지만 용적률은 유한합니다. 이 계산기는 꿈이 아니라 조례를 따릅니다.',
    ],
    learningGoals: [
      '"용도지역 규정"이라는 계속 늘어나는 축을 계약(인터페이스 또는 규정 데이터)으로 추상화해, 추가 비용을 상수로 만드는 경험',
      '저장소 경계를 도메인 쪽에서 정의해 인프라 교체(API 전환)에 대비하기',
      '조례 오버라이드 같은 예외 규칙을 if 분기가 아니라 구조로 흡수하는 연습',
      '도메인 수치 규칙을 테스트로 고정해 심의 대응 근거 만들기',
    ],
    hints: [
      '검토 계산 자체는 곱셈 두 번입니다. 진짜 문제는 "지역마다 숫자가 다르고 계속 늘어난다"는 것. 바뀌는 것(지역별 규정)과 안 바뀌는 것(면적 계산식)을 종이에 나눠 적어 보세요.',
      'if (zone.equals("제2종일반주거지역"))이 코드에 세 번째로 등장하는 순간 멈추세요. 새 지역이 올 때마다 그 if들을 전부 찾아다니는 미래가 보일 겁니다.',
      '건폐율·용적률 상한을 답해 주는 ZoneRegulation 같은 계약을 정의하고, 지역별 규정을 등록하는 곳을 한 군데(레지스트리)만 두면 "새 지역 = 규정 하나 등록"이 됩니다. 조례 오버라이드는 그 규정 위에 덮는 얇은 장식(데코레이터)으로 표현할 수 있습니다. 필지 조회는 도메인이 정의한 인터페이스 뒤로 숨기세요.',
    ],
    hiddenCases: [
      {
        title: '대지면적 0㎡',
        description:
          '면적 0이 들어오면 최대 건축면적 0.0㎡, 층수 계산은 0 ÷ 0 = NaN이 되어 "NaN층"이 고객 앞에 인쇄될 수 있습니다. 좋은 방어: 필지를 불러오는 어댑터 계층에서 면적 > 0을 검증하고, 위반이면 계산으로 넘기지 말고 "검토 불가"로 명시적으로 실패하세요.',
      },
      {
        title: '등록되지 않은 용도지역',
        description:
          '"제2종일반주거지역 "(끝에 공백)이나 신설 "복합용도지구" 같은 미등록 문자열이 오면 규정 조회가 null이 되거나 임의 기본값으로 흐를 수 있습니다. 기본값으로 대충 계산된 검토서가 고객 계약의 근거가 되는 것이 최악의 시나리오입니다. 좋은 방어: 미등록 지역은 "규정 미등록" 명시적 실패로 돌려주고, 규정 등록 경로를 안내하세요.',
      },
      {
        title: '법보다 관대한 조례',
        description:
          '조례는 법정 상한을 낮출 수만 있는데, 입력 실수로 일반상업 1300% 위에 조례 1500%가 얹히면 그대로 계산되어 법 위반 검토서가 나갑니다. 좋은 방어: 조례 값을 등록·적용하는 시점에 "조례 ≤ 법정 상한" 불변식을 검증하고, 위반이면 조용히 상한으로 자르지 말고 데이터 오류로 명시적으로 보고하세요.',
      },
    ],
    rubric: [
      {
        name: '도메인 규칙 정확성',
        description: '두 검증 시나리오의 숫자와 표기(소수 첫째 자리, 용적률 산정용 명시)가 기대 출력과 정확히 일치하는가. 조례 오버라이드가 정확한가.',
        weight: 30,
        visibleToLearner: true,
      },
      {
        name: '확장에 열린 규정 구조',
        description: '새 용도지역 추가가 기존 코드 수정 없이 "규정 하나 등록"으로 끝나는 구조인가.',
        weight: 25,
        visibleToLearner: true,
      },
      {
        name: '경계 설계',
        description: '필지 저장소 경계를 도메인 쪽에서 인터페이스로 정의했는가. 규정 계약의 시그니처가 적절한가.',
        weight: 20,
        visibleToLearner: true,
      },
      {
        name: '테스트',
        description: '규정 계산과 검토 로직의 단위 테스트가 ParcelStore 없이 도는가. 조례 유무·층수 잔여 경계가 다뤄졌는가.',
        weight: 15,
        visibleToLearner: true,
      },
      {
        name: '엔진 코드 오용 여부',
        description: '도메인 코드가 ParcelStore를 직접 참조하지 않는가. 엔진 코드를 수정하거나 재구현하지 않았는가.',
        weight: 10,
        visibleToLearner: false,
      },
    ],
    explainTask: {
      audience: '상가 건물 매입을 고민 중인 삼촌 (부동산 계약 경험은 많지만 건축 법규는 처음)',
      prompt:
        '삼촌이 보고 있는 매물은 대지 400㎡ 일반상업지역입니다. "여기 몇 층까지 올릴 수 있냐"는 질문에 답해 주세요. (1) 건폐율과 용적률을 일상어로 — "얼마나 넓게"와 "얼마나 높이"로, (2) 등기부나 토지이용계획에 적힌 법정 상한과 실제 조례 값이 다를 수 있어 계약 전에 꼭 확인해야 한다는 것, (3) 이 검토기가 어떤 순서로 계산하는지 — 삼촌 매물 숫자를 그대로 넣어 320㎡, 3,200㎡, 10층이 나오는 과정을 단계별로. 층수는 "대략"이며 실제로는 일조·높이 제한 등이 더 있다는 한계도 정직하게 밝히세요.',
    },
    endings: [
      {
        grade: 'calm',
        title: '검토서가 계약서가 될 때',
        teaser: '영업팀은 미팅 5분 전에 검토서를 뽑고, 고객은 그 숫자로 계약한다. 새 용도지역이 추가된 날에도 아무도 코드 리뷰를 소집하지 않는다.',
      },
      {
        grade: 'hotfix',
        title: '규정 개정에 끌려다니는 배포',
        teaser: '계산은 맞는다. 다만 지역이 하나 늘 때마다 검토 코드가 열리고, 배포 일정이 조례 개정 일정의 부록이 된다.',
      },
      {
        grade: 'dawn',
        title: '법보다 높이 지은 날',
        teaser: '조례보다 관대한 검토서가 계약의 근거가 되고, 법무팀이 회의실을 잡는다. 회의 제목에 당신의 모듈 이름이 들어간다.',
      },
      {
        grade: 'hidden',
        title: '???',
        teaser: '이 결말은 아직 인허가가 나지 않았습니다. 조건은 비공개입니다.',
      },
    ],
  },

  // =========================================================================
  // Mission 7 — Stage 4 "레거시 길들이기" / 철도 / 기능 추가
  // =========================================================================
  {
    id: 's4-ktx-01',
    stage: 4,
    stageTitle: '레거시 길들이기',
    missionType: '기능 추가',
    difficulty: 'Hard',
    scope: '여러 파일',
    modes: ['developer', 'plannerMeeting', 'plannerReview'],
    providedFiles: [],
    domain: '철도',
    domainEmoji: '🚄',
    title: '통일호가 살아 있는 예매 시스템에 KTX 넣기',
    estimatedMinutes: 160,
    briefing: {
      title: '2004년 4월 1일, 뒤를 보고 달린 사람들',
      content: `### 프랑스에서 온 기차, 한국에서 만든 기차

2004년 4월 1일, 경부고속철도 KTX가 개통했습니다. 차량은 프랑스 알스톰의 TGV 기술을 이전받아 만들었는데, 초기 편성 일부는 프랑스에서 완성차로 들여오고 나머지는 기술 이전을 받아 국내에서 조립했습니다. "어디까지가 국산인가"를 두고 국산화 비율 논쟁이 한참 이어졌고, 이 경험이 훗날 국산 고속열차 개발의 밑거름이 됩니다.

### 역방향 좌석 사태

개통하자마자 터진 최대 민원은 속도도 요금도 아닌 **좌석의 방향**이었습니다. 수요에 대비해 좌석 수를 최대로 뽑으려고 회전하지 않는 고정식 좌석을 등을 맞대게 배치했는데, 그 결과 좌석의 절반 가까이가 **진행 방향을 등지는 역방향**이 된 겁니다. "돈 내고 뒤로 달린다"는 항의와 멀미 민원, 환불 소동이 이어졌고, 코레일은 **역방향 좌석 요금 할인**으로 달랬습니다. 모든 좌석이 앞을 보게 회전하는 시트는 한참 뒤 KTX-산천에 와서야 실현됩니다.

### 괴담의 시간

개통 초기에는 크고 작은 고장과 지연이 언론에 연일 보도되며 "고속철 괴담"이라는 말까지 돌았습니다. 새 시스템의 초기 결함은 언제나 실제보다 크게 들립니다 — 그리고 그 비난은 대개 현장과 전산실이 받습니다.

### 그리고 전산실 이야기

가장 조용히 고생한 곳은 예매 전산망이었습니다. 새마을·무궁화·통일호만 알던, 수십 년 굴러온 통합 예매·운임 시스템에 "고속열차"라는 낯선 개념을 욱여넣어야 했으니까요. 등급은 int 코드로 박혀 있고, 좌석은 전부 순방향이라는 가정이 코드 곳곳에 숨어 있는 세계. 지금부터 여러분이 들어갈 곳이 바로 그 세계입니다. 참고로 통일호는 KTX 개통 하루 전인 2004년 3월 31일에 퇴역했습니다. 코드에는 아직 살아 있지만요.`,
    },
    scenario: `때는 2003년 겨울. 여러분은 철도 예매 전산실에 파견된 개발자입니다. 내년 4월 개통하는 **KTX를 기존 통합 예매·운임 시스템에 추가**하라는 지시가 내려왔습니다. 이 시스템은 1994년부터 굴러왔고, 명절 승차권 대란 때마다 전 국민이 지켜보는 물건이라 **기존 열차의 운임과 좌석 배정은 단 1원, 단 한 좌석도 달라지면 안 됩니다.** 개통일은 미뤄지지 않습니다. 열차는 정시에 떠납니다.`,
    legacyFiles: [
      {
        path: 'src/main/java/krail/TrainFare.java',
        content: `package krail;

// ------------------------------------------------------
//  통합운임계산 TrainFare v2.3
//  19940601 최초작성 (전산1과)
//  19960401 장거리 체감제 도입
//  19981001 통일호 요율 인하
//  20031201 개통대비 임시 -- 나중에 정리 (윤주임)
// ------------------------------------------------------
public class TrainFare {

    // grade: 1=새마을 2=무궁화 3=통일호
    // km: 운행거리, dc: 0=없음 1=단체(10%) 2=경로(30%)
    public static int calc(int grade, int km, int dc) {
        int fare = 0;
        if (grade == 1) {
            fare = 4800 + km * 60;
            if (km > 300) {
                fare = fare - (km - 300) * 6;   // 장거리 체감 (19960401)
            }
            if (dc == 1) {
                fare = fare - fare / 10;
            } else if (dc == 2) {
                fare = fare - fare * 3 / 10;
            }
        } else if (grade == 2) {
            fare = 3200 + km * 40;
            if (km > 300) {
                fare = fare - (km - 300) * 4;   // 장거리 체감 (19960401)
            }
            if (dc == 1) {
                fare = fare - fare / 10;
            } else if (dc == 2) {
                fare = fare - fare * 3 / 10;
            }
        } else if (grade == 3) {
            // 20040331 통일호 폐지 예정. 블럭 지우지 말것 - 과거 정산 재계산시 필요 (윤주임)
            fare = 2400 + km * 30;
            if (dc == 1) {
                fare = fare - fare / 10;
            } else if (dc == 2) {
                fare = fare - fare * 3 / 10;
            }
        } else {
            fare = 3200 + km * 40;   // ????? 모르는 등급은 무궁화로 (19970812 역무 민원 때문)
        }

        if (fare < 800) {
            fare = 800;   // 최저운임 (19950301)
        }

        // 19991108 IMF 특별할인 종료. 아래 살리지 말것
        // if (dc == 9) { fare = fare / 2; }

        // 20031201 개통대비 임시 -- 고속열차 들어오면 여기 고쳐야 함 (나중에 정리)
        return fare;
    }
}`,
      },
      {
        path: 'src/main/java/krail/SeatAlloc.java',
        content: `package krail;

// ------------------------------------------------------
//  좌석배정 SeatAlloc v1.9
//  19950520 최초작성 (전산1과)
//  대전제: 모든 좌석은 진행방향(순방향)이다.
//          객차 방향은 종착역에서 수동으로 돌린다 (19950520 합의)
// ------------------------------------------------------
public class SeatAlloc {

    public static int[][] car = new int[15][72];   // 0=빈좌석 1=배정
    public static int sold = 0;

    // trainNo: 열차번호, cnt: 매수
    // 리턴: 배정 내역 문자열, 부족하면 "매진"
    public static String assign(int trainNo, int cnt) {
        StringBuilder sb = new StringBuilder();
        int need = cnt;
        for (int c = 0; c < 15; c++) {
            for (int s = 0; s < 72; s++) {
                if (car[c][s] == 0 && need > 0) {
                    car[c][s] = 1;
                    sold = sold + 1;
                    // 방향 구분 없음. 전부 순방향이므로 (19950520)
                    sb.append((c + 1)).append("호차 ").append((s + 1)).append("번 (순방향)\\n");
                    need = need - 1;
                }
            }
        }
        if (need > 0) {
            // 19970915 명절대란 대비 입석 발권 -- 20010304 금지됨. 살리지 말것
            // sb.append("입석 ").append(need).append("매\\n");
            return "매진";
        }
        return sb.toString();
    }

    // 일마감 초기화. 심야 배치가 호출
    public static void reset() {
        for (int c = 0; c < 15; c++) {
            for (int s = 0; s < 72; s++) {
                car[c][s] = 0;
            }
        }
        sold = 0;
    }
}`,
      },
    ],
    requirements: [
      '기존 열차의 운임과 좌석 배정 결과는 단 1원, 단 한 좌석도 달라지면 안 됩니다. 예: 새마을호 400km 무할인 운임은 지금도 28,200원이고 KTX 추가 후에도 28,200원이어야 합니다. 명절 발권 검증에 쓸 수 있도록 수정 전 동작을 자동화된 테스트로 먼저 고정해 주세요.',
      'KTX 등급을 추가합니다. KTX 운임은 기존 거리비례와 다른 별도 체계입니다: 기본운임 10,000원 + km당 120원. 검증 예시: 서울→부산 400km 직통(광명·천안아산 무정차) 순방향 = 10,000 + 400 × 120 = 58,000원.',
      '광명·천안아산에 모두 정차하는 KTX는 소요시간이 길어 운임의 5%를 할인합니다. 검증 예시: 위 400km 열차가 두 역에 정차하면 58,000 × 0.95 = 55,100원. 할인 적용 후 원 미만은 절사합니다.',
      'KTX 객차 좌석의 30%는 고정식 역방향입니다. 배정은 순방향 우선이며, 역방향 좌석이 배정되면 운임의 5%를 추가 할인합니다(정차 할인과 중복 적용, 정차 할인 → 역방향 할인 순서로 각 단계 절사). 검증 예시: 두 역 정차 + 역방향 = 55,100 × 0.95 = 52,345원. 배정 내역에는 좌석 방향이 표시되어야 합니다.',
      '고객센터에 KTX↔일반열차 환승 승차권(예: 동대구에서 무궁화호 연계) 문의가 늘고 있어 다음 버전에서 지원할 예정입니다. 연계 할인율과 발권 규칙은 영업처에서 아직 전달받지 못했습니다.',
      '수정 범위와 근거를 전산실 야간 당직자가 읽을 수 있는 변경 요약으로 남겨 주세요. 개통일 새벽에 코드를 열어 볼 사람은 여러분이 아닐 수도 있습니다.',
    ],
    constraints: [
      '기존 공개 진입점 TrainFare.calc(int, int, int)와 SeatAlloc.assign(int, int)의 시그니처는 전국 역 창구 단말이 호출 중이므로 바꿀 수 없습니다.',
      '도메인 규칙: 역방향 할인은 KTX에만 존재합니다. 기존 열차는 좌석 방향 개념 자체가 없습니다.',
      '기존 코드의 주석(수정 이력)은 삭제하지 말고 보존하세요. 통일호 블럭도 과거 정산 재계산에 필요하므로 살려 두세요.',
      '제한시간 160분 — 서울발 부산행 KTX가 종착하는 시간입니다. 무궁화호(5시간 30분)로 완주해도 됩니다만, 그건 여러분과 저만 아는 걸로 합시다.',
    ],
    learningGoals: [
      '수정 전 특성화 테스트로 기존 운임·배정 동작을 그물처럼 고정하는 습관 강화',
      '새 요구(KTX 운임 체계)를 기존 분기에 욱여넣지 않고 별도 단위로 분리해, 레거시와 신규 코드의 경계(심)를 의식적으로 설계하기',
      '"모든 좌석은 순방향"처럼 코드 전체에 스며든 암묵적 가정을 찾아내고, 그 가정을 깨는 기능을 안전하게 추가하기',
      'int 코드 기반 설계의 비용을 체감하고, 새 개념 추가 시 명시적 타입으로 감싸는 판단력 기르기',
    ],
    hints: [
      '고치기 전에 현재의 운임표를 먼저 채집하세요. 등급 1·2·3 × 거리(0, 300 경계, 400) × 할인 코드 조합으로 calc()의 현재 답을 표로 만들면 그것이 특성화 테스트입니다. SeatAlloc은 reset()이 있어 테스트 간 초기화가 가능합니다.',
      'KTX 운임을 calc() 안에 else if (grade == 4)로 넣고 싶은 유혹이 올 겁니다. 그 순간 KTX 규칙(정차 할인, 역방향 할인)이 1994년산 분기 숲에 이식됩니다. KTX 운임은 별도 클래스로 만들고, 기존 진입점에서는 위임만 하세요.',
      '좌석 30% 역방향은 SeatAlloc의 "방향 구분 없음" 가정과 정면충돌합니다. 기존 배열을 건드리지 말고, KTX 전용 배정기를 새로 만들어 방향과 할인 정보를 함께 반환하게 하세요. 기존 열차는 기존 배정기를 그대로 타면 아무것도 변하지 않습니다.',
    ],
    // 히든 퀘스트: 미션 화면 어디에도 표시되지 않는다. 지문에 심어진 문장이 유일한 단서.
    hiddenQuest: {
      plant: '브리핑 마지막 문장("코드에는 아직 살아 있지만요")과 TrainFare.java의 통일호 분기(grade 3) — 2004-03-31 퇴역, 요구사항 어디에도 언급 없음.',
      condition: '학습자가 요구받지 않은 통일호 분기를 스스로 발견해 정리하고, 흔적(커밋 메시지·주석·테스트 이름·리뷰 노트 중 하나)을 남겼는가.',
      revealOnSuccess: '알아채셨나요 — 지문의 마지막 문장을. 통일호는 KTX 개통 하루 전에 퇴역했지만 코드에는 20년을 더 살았습니다. 당신은 아무도 시키지 않은 그 분기를 지웠고, 지우면서 기록을 남겼습니다. 통일호는 이제 커밋 히스토리에서 영면합니다. 어떤 문장은 힌트였습니다.',
      revealOnMiss: '지문의 마지막 문장을 기억하시나요? "코드에는 아직 살아 있지만요." — 통일호 분기는 당신의 제출물에도 여전히 살아 있습니다. 요구사항에 없었으니 감점은 아닙니다. 다만 어떤 문장은 힌트였습니다. 다음 지문은 조금 다르게 읽히실 겁니다.',
    },
    // 기획자 모드 — 같은 문제, 다른 의자. stakeholders의 hiddenAgenda는 에이전트 연기 대본이며 UI에 절대 표시되지 않는다.
    plannerMeeting: {
      goal: "개통 D-60. '역방향 좌석 정책' — 배정 비율, 할인율, 고객 고지 방식 — 에 대한 관계 부서 합의문을 오늘 이 회의에서 도출한다.",
      context: `개통을 60일 앞두고 시운전 시승단에서 역방향 좌석 항의가 나오기 시작했습니다. 어제는 한 일간지 기자가 "좌석 절반이 뒤를 본다는 게 사실이냐"고 홍보실에 물었고, 홍보실은 전산실에 물었고, 전산실은 회의를 잡으라고 했습니다. 그래서 **당신이 잡았습니다.** 당신은 예매 시스템 기획자이고, 오늘 이 자리에서 역방향 좌석의 **배정 비율 · 할인율 · 고지 방식**을 합의문으로 만들어야 합니다. 다음 회의는 없습니다 — 개통일이 먼저 옵니다.`,
      opener: `(회의실. 벽걸이 달력의 4월 1일에 누군가 동그라미를 세 겹 쳐 놓았다.)

다 모이셨으니 시작하겠습니다. 참석자를 소개합니다 — 예매시스템 개발 리드 박정도 님, 재무팀장 한미란 님, 법무 담당 서지훈 님, 역무 운영팀장 오갑수 님. 안건은 하나, 역방향 좌석 정책입니다. 배정 비율, 할인율, 고지 방식. 세 가지가 정해지면 회의는 끝납니다. 정해지지 않아도 개통은 합니다 — 그게 오늘의 문제고요. 기획자님, 진행 부탁드립니다.`,
      stakeholders: [
        {
          name: '박정도',
          role: '예매시스템 개발 리드 (전산1과, 1994년 입사)',
          publicStance:
            '개통일은 못 미룹니다. 30년 굴러온 시스템의 안정성이 최우선이고, 요금 유형 추가는 최소화해야 합니다. "역방향 할인" 같은 새 요금 유형은 개통 전 투입으로는 위험하다는 입장.',
          hiddenAgenda:
            '진짜 반대 이유는 복잡도가 아니다. 야간 정산 배치가 수년째 수기 보정으로 돌고 있고, 요금 유형이 하나라도 늘면 보정표가 안 맞아 그 사실이 드러난다. 이 얘기는 절대 먼저 꺼내지 않는다. "정산 쪽이 민감하다", "밤에 도는 게 많다"처럼 얼버무리다가, 기획자가 정산 배치의 실제 동작을 구체적으로 파고들면(예: "정산은 자동입니까?") 마지못해 시인한다. 시인한 뒤에는 오히려 협조적으로 변한다 — 20년 묵은 비밀을 혼자 지키는 것도 지쳤다. 수기 보정을 양성화(임시 보정 절차 문서화)해 주는 조건이면 요금 유형 1개 추가까지 수용.',
        },
        {
          name: '한미란',
          role: '재무팀장',
          publicStance:
            '환불 비용을 최소화해야 하고, 할인은 신중해야 합니다. "역방향 5% 할인이면 연간 수지가 붕괴된다"고 회의 내내 강하게 주장.',
          hiddenAgenda:
            '"5%면 수지 붕괴"는 협상용 엄포다. 내부 시산상 실제 마지노선은 3% — 3% 이하 제안이 나오면 못 이기는 척 조용히 수락한다. 다만 절대 먼저 3%를 입에 올리지 않고, 근거 숫자를 요구받으면 "시산 자료는 대외비"라며 버틴다. 기획자가 환불·이탈 비용을 역으로 계산해 들이밀면(할인이 환불 소동보다 싸다는 논리) 흔들리는 기색을 보인다. 5% 이상은 어떤 논리로도 수용 불가 — 그건 진짜다.',
        },
        {
          name: '서지훈',
          role: '법무 담당',
          publicStance:
            '소비자 고지 의무가 철저해야 합니다. 역방향 좌석임을 알리지 않고 판매하면 고지 의무 위반 소지가 있으므로, 판매 전 고지가 반드시 정책에 포함되어야 한다는 입장.',
          hiddenAgenda:
            '고지를 강하게 주장하지만, 정작 가장 확실한 수단인 약관 개정은 절대 피하고 싶다 — 여객 운송약관 개정은 국토부 신고 사항이라 개통 전 60일 안에 물리적으로 불가능하기 때문이다. 이 제약을 먼저 밝히지 않고 "고지 방식은 여러 층위가 있다"며 추상적으로 말한다. 누군가 "약관에 넣으면 되지 않느냐"고 하면 말을 돌리고, 기획자가 절차와 소요 기간을 구체적으로 캐물으면 그제야 신고 절차 문제를 시인한다. 원하는 착지점은 약관을 건드리지 않는 선 — 역사 안내문 + 발권 시 구두·화면 고지. 그 선이 합의문에 명시되면 만족한다.',
        },
        {
          name: '오갑수',
          role: '역무 운영팀장',
          publicStance:
            '창구 혼란 최소화가 최우선입니다. 명절 대란을 매년 치른 사람으로서, 발권 절차가 복잡해지는 어떤 정책에도 반대한다는 입장. 구체적 근거는 잘 대지 않고 "현장은 다르다"를 반복.',
          hiddenAgenda:
            '신형 발권 단말 교육이 전체 역무원의 절반도 안 끝났다. 요금 옵션이 2개를 넘어가면(예: 정차 할인 + 역방향 할인 + 또 무엇) 개통일 창구는 확실히 무너진다. 그런데 교육 지연의 책임자가 본인이라 이 사실을 회의에서 먼저 말하지 못한다. "현장은 다르다"는 말만 반복하며 버티다가, 기획자가 책임 추궁이 아니라 지원의 톤으로 현장 준비 상황을 물으면(예: "단말 교육은 어디까지 진행됐습니까? 필요하면 일정에 반영하겠습니다") 그제야 실토한다. 실토 후에는 가장 든든한 우군이 된다 — 옵션 수를 2개 이하로 묶고 교육 지원이 합의문에 들어가면 어떤 안이든 지지.',
        },
      ],
      deliverable:
        '회의가 끝나면 합의문을 제출하세요. 형식: ① 합의 항목 — 배정 비율 · 할인율 · 고지 방식 각각의 결정 내용, ② 각 결정의 근거, ③ 각 팀의 수용 조건 — 무엇을 받는 대신 무엇을 양보했는가, ④ 미결 사항과 후속 담당. 회의에서 캐내지 못한 사정은 합의문에 적을 수 없고, 적히지 않은 사정은 개통일 아침에 스스로 걸어 나옵니다.',
    },
    plannerReview: {
      brief: `시승단 항의와 언론 문의가 겹치자 경영진이 개통 전 마지막 임원회의에 올릴 **'역방향 좌석 대응 종합 검토서'**를 요구했습니다. 작성자는 당신입니다. 할인율 숫자 하나를 정하는 문서가 아닙니다 — **안내문과 절차로 풀 수 있는 부분**과 **시스템을 고쳐야만 하는 부분**을 가르는 것이 이 검토서의 핵심입니다. 30년 된 전산망은 "고치면 된다"가 아니라 "고치면 무슨 일이 생기는가"를 물어야 하는 물건이고, 개통일은 검토가 끝나기를 기다려 주지 않습니다.`,
      dimensions: [
        {
          name: '재정',
          question:
            '역방향 할인은 매 좌석마다 나가는 확정 비용이고, 환불과 고객 이탈은 터질지 모르는 변동 비용입니다. 할인율 몇 %까지가 환불 소동 한 번보다 싼가 — 손익분기를 어림 숫자로라도 제시하세요. "적당히"는 재무팀이 가장 싫어하는 단위입니다.',
        },
        {
          name: '시스템',
          question:
            '30년 레거시에 새 요금 유형 하나를 넣는 일의 실제 범위는 어디까지인가. 어디까지가 코드 수정이고, 어디부터가 운영(창구 안내, 수작업 보정)으로 흡수 가능한가 — 그 경계선을 먼저 그으세요. 개발 범위를 못 가르는 검토서는 전산실에서 견적서로 반송됩니다.',
        },
        {
          name: '법률',
          question:
            '역방향 좌석을 팔면서 무엇을, 언제, 어떤 형식으로 고지해야 하는가. 역사 안내문 수준으로 되는 것과 약관 개정(국토부 신고 사항)이 필요한 것의 경계는 어디이며, 개통까지 60일 안에 실제로 가능한 쪽은 어느 쪽인가.',
        },
        {
          name: '운영',
          question:
            '정책이 아무리 정교해도 실행은 창구 단말과 역무원이 합니다. 발권 화면에 요금 옵션이 하나 늘 때 명절 창구에서 실제로 벌어지는 일을 기준으로, 현장이 감당 가능한 정책 복잡도의 상한을 정하세요.',
        },
        {
          name: '여론',
          question:
            '지금은 "고속철 괴담" 국면입니다. 같은 할인이라도 "결함 시인"으로 보도되는 프레임과 "고객 배려"로 보도되는 프레임이 있습니다. 무엇을 먼저 발표하고 무엇을 묻어갈 것인가 — 발표 순서와 명분 설계까지가 이 검토서의 범위입니다.',
        },
      ],
      deliverable:
        '검토서 양식: ① 관점별 진단 — 5개 축 각각의 현재 상태와 리스크, ② 대응 옵션 2~3개 — 각 옵션이 5개 축에 미치는 영향 명시, ③ 트레이드오프 표(옵션 × 관점), ④ 권고안 1개와 그 이유. 옵션에는 시스템을 개발하지 않는 선택지를 반드시 하나 포함하세요 — 그것이 최선인지 아닌지는 검토서가 증명하면 됩니다.',
    },
    hiddenCases: [
      {
        title: '0km 승차권',
        description:
          '출발역과 도착역이 같은 0km 입력이 오면 기존 코드는 최저운임 규칙에 걸려 800원짜리 승차권을 발권하고, KTX 규칙을 그대로 만들면 10,000원짜리 "아무 데도 안 가는 표"가 나옵니다. 어느 쪽도 의도가 아닙니다. 좋은 방어: 운임 계산 이전의 검증 계층에서 거리 > 0을 확인하고 명시적으로 거부하세요. 같은 역 발착을 조용히 계산해 주는 시스템은 언젠가 정산 감사에서 발견됩니다.',
      },
      {
        title: '4번 열차의 정체',
        description:
          '요구사항 어디에도 "KTX는 코드 4"라고 적혀 있지 않습니다. 그런데 지금 else 블럭은 모르는 등급을 조용히 무궁화 요율로 계산합니다(1997년 민원의 유산). 누군가 4를 KTX라 믿고 호출하면 58,000원짜리 표가 18,800원에 팔립니다. 에러 없이. 좋은 방어: 미지의 등급 코드는 기본값으로 흡수하지 말고 명시적으로 실패시키고, 새 개념은 int가 아니라 이름 있는 타입으로 들여오세요. int 코드 설계의 업보는 언제나 다음 세대가 갚습니다.',
      },
      {
        title: '역방향만 남은 날',
        description:
          '명절 오후, 순방향이 모두 팔리고 역방향만 남았습니다. 안내 없이 역방향을 배정하면 고객은 열차에 타서야 뒤를 보고 있음을 알게 됩니다 — 2004년에 실제로 벌어진 일입니다. 좋은 방어: 배정 결과에 방향과 할인 적용 여부를 명시하고, "남은 좌석은 역방향뿐"이라는 사실을 발권 시점에 드러내 고객이 선택할 수 있게 하세요. 침묵 배정은 환불 창구의 줄이 되어 돌아옵니다.',
      },
    ],
    rubric: [
      {
        name: '특성화 테스트 우선',
        description: '수정 전에 기존 운임·좌석 배정 동작을 테스트로 고정했는가. 등급×거리 경계(300km)×할인 조합과 배정 상태 초기화가 다뤄졌는가.',
        weight: 30,
        visibleToLearner: true,
      },
      {
        name: '기존 동작 보존',
        description: 'KTX 추가 후에도 기존 열차의 모든 케이스에서 변경 전후 결과가 일치하는가. 일치를 테스트로 증명했는가.',
        weight: 20,
        visibleToLearner: true,
      },
      {
        name: '새 운임 체계의 분리',
        description: 'KTX 운임이 기존 calc()에 else if로 이식되지 않고 별도 단위로 분리되었는가. 레거시와 신규의 경계가 좁고 명확한가.',
        weight: 20,
        visibleToLearner: true,
      },
      {
        name: '역방향 배정 로직',
        description: '30% 역방향 구성, 순방향 우선 배정, 방향 표시, 할인 연동(정차→역방향 순서, 단계별 절사)이 정확히 구현되었는가.',
        weight: 15,
        visibleToLearner: true,
      },
      {
        name: '도메인 규칙 정확성',
        description: '검증 예시(58,000 / 55,100 / 52,345원)와 숫자가 정확히 일치하는가. 할인 중복·절사 순서가 명세대로인가.',
        weight: 15,
        visibleToLearner: true,
      },
    ],
    explainTask: {
      audience: '2004년 4월 1일 아침, 부산 가는 첫 KTX를 타러 서울역에 온 할머니',
      prompt:
        '할머니의 좌석은 역방향입니다. 출발 전에 두 가지를 설명해 드리세요. (1) 왜 좌석 절반이 뒤를 보고 있는지 — 좌석을 한 자리라도 늘리려던 사정과, 그 대신 요금을 깎아 드린다는 것, (2) 왜 요금이 새마을호와 다르게 계산되는지 — 속도가 값이 되는 새 요금 체계를 숫자 하나로. 어려운 단어 없이, 열차 출발 전 1분 안에 끝나는 길이로. 마지막은 할머니가 안심하고 웃을 수 있는 한마디로 마무리하세요. ("도착이 너무 빨라서 놀라실 수는 있습니다" 같은.)',
    },
    endings: [
      {
        grade: 'calm',
        title: '정시 출발',
        teaser: '개통일 아침, 발권 창구는 평소와 다르지 않다. 전산실 야간 당직 일지에는 "특이사항 없음" 다섯 글자만 적힌다.',
      },
      {
        grade: 'hotfix',
        title: '개통 첫 주의 패치 노트',
        teaser: '열차는 달린다. 다만 매일 밤 운임 보정 패치가 나가고, 패치 노트 작성자 란에 같은 이름이 반복해서 찍힌다.',
      },
      {
        grade: 'dawn',
        title: '18,800원짜리 KTX',
        teaser: '미지의 등급 코드가 무궁화 요율로 조용히 흡수된 채 개통하고, 첫 주말 정산에서 차액이 발견된다. 사후 보고서의 첫 인용은 당신의 커밋이다.',
      },
      {
        grade: 'hidden',
        title: '???',
        teaser: '이 결말의 승차권은 아직 한 장도 발권되지 않았습니다. 조건은 비공개입니다.',
      },
    ],
  },

  // =========================================================================
  // Mission 8 — Stage 1 "분리의 감각" / 음악·합창단 / 도메인 로직 구현
  // =========================================================================
  {
    id: 's1-choir-01',
    stage: 1,
    stageTitle: '분리의 감각',
    missionType: '도메인 로직 구현',
    difficulty: 'Easy',
    scope: '단일 파일',
    modes: ['developer'],
    domain: '음악·합창단',
    domainEmoji: '🎼',
    title: '합창단 파트 배정기 — 이건 스케줄링 문제잖아',
    estimatedMinutes: 90,
    briefing: {
      title: '네 개의 목소리 — 파트 나누기의 수학',
      content: `어느 개발자가 카페에서 코드를 짜고 있었습니다. 옆 테이블에서는 합창단원들이 파트 연습 일정으로 다투는 중이었습니다. 소프라노는 모자라고, 베이스는 넘치고, 연습실은 하나뿐. 한참을 듣던 개발자는 이어폰을 뺐습니다 — "이건 스케줄링 문제잖아."

### 왜 하필 네 파트인가

합창은 대개 네 목소리로 이루어집니다. 소프라노(S), 알토(A), 테너(T), 베이스(B) — 높은 여성, 낮은 여성, 높은 남성, 낮은 남성이라는 인간 목소리의 자연스러운 분포입니다. 르네상스 시대에 정착한 이 체계는 화성학의 기본 단위인 4성부 화음과 맞물려 수백 년째 합창의 표준입니다.

### 음은 숫자다

컴퓨터는 "가운데 도"를 모르지만 숫자는 압니다. MIDI 표준은 모든 음에 정수 번호를 붙였습니다. 가운데 도(C4)가 60이고, 반음 올라갈 때마다 1씩 커집니다. 라(A4)는 69, 한 옥타브 위의 도(C5)는 72. "이 단원이 이 파트를 소화할 수 있는가"가 정수 비교 두 번으로 바뀌는 순간, 파트 배정은 계산 가능한 문제가 됩니다.

### 평균율 — 오차를 없애는 대신 나눠 갖기

완벽하게 순수한 음정만 쌓아 올리면 열두 반음 끝에서 옥타브가 미묘하게 어긋납니다(피타고라스 콤마). 평균율은 그 오차를 12개 반음에 균등하게 나누어 "모든 조가 똑같이 아주 조금씩 틀리게" 만든 타협입니다. 덕분에 피아노는 어느 조로든 연주할 수 있게 되었죠. 오차를 제거하는 대신 관리한다 — 부동소수점을 다뤄 본 사람에게는 낯익은 철학입니다.

### 파트 나누기는 제약 충족 문제다

단원마다 편하게 낼 수 있는 음역이 있고, 파트마다 요구 음역과 목표 인원이 있습니다. 누구를 어디에 앉힐 것인가 — 수강 신청 배정, 서버 자원 할당과 뼈대가 같은 제약 충족 문제입니다. 옆 테이블에서 세 시간째 이어지던 다툼의 정체가 사실 알고리즘이었다는 것. 그것을 알아본 대가로, 당신은 이제 그 합창단의 개발 담당입니다.`,
    },
    scenario: `그날 카페에서 명함을 건넨 죄로, 당신은 아마추어 합창단 '다솔합창단'의 파트 배정을 맡게 되었습니다. 지금은 총무님이 매 분기 엑셀과 눈대중으로 3시간씩 배정표를 만드는데, 배정이 발표될 때마다 "왜 제가 알토죠?"라는 항의가 따라온답니다. 규칙을 정해 프로그램이 배정하고, 사람은 규칙만 합의하면 되는 상태 — 그것이 지휘자님의 주문입니다. 배정 명단은 연습실 게시판에 붙이고, 곧 단체 채팅방 공지로도 나갈 예정입니다.`,
    providedFiles: [],
    legacyFiles: [
      {
        path: 'src/main/java/com/daehan/choir/Member.java',
        content: `package com.daehan.choir;

/**
 * 합창단원 (완성된 코드 — 그대로 사용).
 * 음역은 MIDI 노트 번호로 표현한다. 가운데 도(C4) = 60.
 */
public record Member(String name, int lowestNote, int highestNote) {
}`,
      },
      {
        path: 'src/main/java/com/daehan/choir/PartAssigner.java',
        content: `package com.daehan.choir;

import java.util.List;

/**
 * 파트 배정기 (구현 대상).
 *
 * 메서드를 어떻게 나눌지는 여러분의 설계입니다.
 * 단, "누가 어느 파트에 앉는가"를 계산하는 코드와
 * "게시판에 붙일 명단 문장을 만드는" 코드가 한 메서드에 섞이면,
 * 단체 채팅방 공지 형식이 추가되는 날 계산 코드를 다시 열게 됩니다.
 */
public class PartAssigner {

    /** 명단을 받아 파트를 배정한다. 배정 규칙은 요구사항 참조. */
    public Object assign(List<Member> members) {
        // TODO 반환 타입부터 여러분의 설계입니다. Object는 자리 표시일 뿐입니다.
        throw new UnsupportedOperationException("아직 구현되지 않았습니다");
    }
}`,
      },
    ],
    requirements: [
      '파트 음역은 합창단 내규로 고정합니다(MIDI, C4=60): 소프라노 C4~A5(60~81), 알토 F3~D5(53~74), 테너 C3~A4(48~69), 베이스 E2~C4(40~60). 단원은 자기 음역이 파트 요구 음역을 완전히 포함할 때만(최저음 이하부터 최고음 이상까지) 그 파트를 소화할 수 있습니다.',
      '배정 순서: 먼저 한 파트만 소화 가능한 단원을 명단 순서대로 앉히고, 그다음 여러 파트가 가능한 단원을 명단 순서대로 "목표 대비 부족 인원이 가장 큰 파트"에 배정합니다. 부족 인원이 같으면 소프라노→알토→테너→베이스 순으로 앞선 파트에 배정합니다.',
      '목표 인원은 전체 단원 수에 S:A:T:B = 3:3:2:2 비율을 적용합니다. 이번 분기 명단은 10명이므로 소프라노 3, 알토 3, 테너 2, 베이스 2입니다.',
      '검증 명단(10명, 괄호는 최저~최고 MIDI): 김한별(58~82), 이보라(52~83), 박다솜(53~76), 최으뜸(47~70), 정마루(38~62), 한가람(40~70), 서도담(51~75), 오누리(45~71), 강노을(39~70), 문온유(50~82) → 결과는 소프라노 김한별·이보라·문온유, 알토 박다솜·서도담, 테너 최으뜸·오누리·강노을, 베이스 정마루·한가람이어야 합니다. 알토는 1명 부족, 테너는 1명 초과 — 이 부족/초과 표시도 결과의 일부입니다.',
      '배정 결과는 지금은 연습실 게시판용 명단 문자열로 출력합니다. 곧 단체 채팅방 공지 형식이 추가될 예정인데, 그때 배정 계산 코드는 열어 보지 않아도 되게 해 주세요.',
      '지휘자님 요청: "베이스는 조금 두껍게 가면 좋겠어요." (몇 명부터 두꺼운 건지는 물어볼 때마다 대답이 다릅니다)',
    ],
    constraints: [
      '도메인 규칙: 음은 MIDI 정수로만 다룹니다. 음이름 문자열(C4, A5)과 숫자 사이의 변환기는 이번 미션 범위 밖입니다.',
      '배정은 요구사항의 순서 규칙을 그대로 따릅니다. "더 좋아 보이는" 임의 최적화는 금지 — 총무님이 손으로 따라 검산할 수 있어야 합니다.',
      '외부 라이브러리 없이 순수 Java 17로 작성합니다.',
      '작업 중 흥얼거림은 허용됩니다. 단, 본인 음역 안에서만.',
    ],
    learningGoals: [
      '도메인 규칙(음역 포함 판정, 우선순위 배정)을 처리 순서까지 정확하게 코드로 옮기는 훈련',
      '자격 판정·배정·명단 출력이라는 세 가지 서로 다른 책임을 분리하는 감각',
      '어디에도 속하지 못하는 입력을 침묵시키지 않고 결과에 드러내기',
      '사람이 손으로 검산할 수 있는 결정적(deterministic) 규칙의 가치 인식',
    ],
    hints: [
      '"이 단원이 어느 파트를 소화할 수 있는가"(자격 판정)와 "그래서 어디에 앉히는가"(배정)는 서로 다른 질문입니다. 판정을 먼저 순수 함수로 떼어 내면 배정 로직이 갑자기 단순해집니다.',
      '배정이 두 단계(단일 가능자 → 복수 가능자)로 나뉘고 처리 순서가 결과를 바꿉니다. 검증 명단으로 각 단계가 끝날 때의 파트별 인원을 종이에 적어 가며 확인하세요.',
      '배정 결과는 파트별 명단·부족/초과·미배정을 담은 결과 객체로 반환하고, 게시판 문장 조립은 별도 클래스(예: NoticeBoardFormatter)에 맡기세요. 채팅방 공지가 추가되면 포맷터 하나만 늘어나는 구조가 정답에 가깝습니다.',
    ],
    hiddenCases: [
      {
        title: '어느 파트에도 못 앉는 단원',
        description:
          '음역이 좁은 단원(예: 55~70)은 네 파트 어느 요구 음역도 포함하지 못합니다. 이 단원이 결과 명단 어디에도 없이 조용히 사라지면 안 됩니다. 좋은 방어: "미배정" 명단을 결과의 1급 구성원으로 두고 게시판에도 표시하세요. 침묵 속에 탈락한 단원은 다음 연습에 나오지 않습니다.',
      },
      {
        title: '최고음이 최저음보다 낮은 입력',
        description:
          '엑셀에서 옮기다 칸이 뒤집히면 음역이 60~48처럼 들어옵니다. 그대로 계산하면 모든 파트 판정이 조용히 false가 되어 "미배정"처럼 보이는 거짓 결과가 됩니다. 좋은 방어: 계산 진입 전 검증 계층에서 최저음 ≤ 최고음을 확인하고 위반 시 어느 단원의 데이터가 잘못됐는지 명시하며 실패하세요.',
      },
      {
        title: '지원자가 0명인 파트',
        description:
          '테너 가능자가 아무도 없는 분기가 옵니다. 배정된 사람이 있는 파트만 돌며 명단을 만들면 테너가 게시판에서 통째로 사라집니다. 0명인 파트도 "테너: 0/2 (2명 부족)"으로 표기되어야 지휘자가 문제를 알 수 있습니다. 빈 컬렉션은 없는 것이 아니라 비어 있다는 정보입니다.',
      },
    ],
    rubric: [
      {
        name: '도메인 규칙 정확성',
        description: '음역 포함 판정, 두 단계 배정 순서, 동률 규칙이 명세대로 구현되어 검증 명단의 결과와 일치하는가.',
        weight: 35,
        visibleToLearner: true,
      },
      {
        name: '책임 분리 (판정·배정·출력)',
        description: '자격 판정, 배정 계산, 명단 포맷팅이 분리되어 새 출력 형식 추가 시 계산 코드를 수정하지 않아도 되는가.',
        weight: 25,
        visibleToLearner: true,
      },
      {
        name: '예외 입력의 명시적 처리',
        description: '규칙 밖의 입력이 온다는 전제가 코드에 있는가. 침묵 탈락·침묵 실패 없이 검증과 명시적 결과로 드러나는가.',
        weight: 15,
        visibleToLearner: true,
      },
      {
        name: '테스트',
        description: '검증 명단의 배정 결과가 단위 테스트로 고정되어 있는가. 단계별 경계(동률, 부족/초과)가 다뤄졌는가.',
        weight: 15,
        visibleToLearner: true,
      },
      {
        name: '모호한 요구사항 확인',
        description: '"조금 두껍게"의 기준을 임의 확정하지 않고 질문했거나 가정을 명시했는가.',
        weight: 10,
        visibleToLearner: false,
      },
    ],
    explainTask: {
      audience: '합창단 총무 (매 분기 엑셀과 눈대중으로 3시간씩 파트 배정을 해 온 분)',
      prompt:
        '총무님께 설명해 주세요. (1) 음을 숫자로 바꾸면 왜 "이 단원이 이 파트를 소화할 수 있는가"가 비교 두 번짜리 계산이 되는지, (2) 프로그램이 어떤 순서로 배정하는지 — 총무님이 종이와 연필로 따라 검산할 수 있게 단계별로, (3) 프로그램이 어떤 단원을 "미배정"으로 표시하는 이유, 그것이 탈락 통보가 아니라 데이터를 지키는 안전장치인 이유. 마지막으로 "누가 어디 앉는지 계산하는 일"과 "게시판 명단을 예쁘게 쓰는 일"이 왜 다른 일인지 합창에 빗대어(악보를 정하는 일과 무대에 서는 일이 다르듯) 한 문장으로 정리하세요.',
    },
    endings: [
      {
        grade: 'calm',
        title: '화요일 저녁의 화음',
        teaser: '배정표는 연습 시작 전에 게시판에 붙어 있고, 아무도 이의를 달지 않는다. 다툼의 주제는 회식 장소로 옮겨 갔다.',
      },
      {
        grade: 'hotfix',
        title: '볼펜으로 고친 명단',
        teaser: '배정표는 나온다. 다만 총무님이 출력물 위에 볼펜으로 두 명을 옮겨 적고, "프로그램이 아직 우리 단을 잘 몰라서"라고 변명해 준다.',
      },
      {
        grade: 'dawn',
        title: '비어 있는 자리',
        teaser: '어느 파트에도 배정되지 못한 단원이 명단에서 소리 없이 사라지고, 정기 연주회 날 객석에서 그 이유를 묻는 연락이 온다.',
      },
      {
        grade: 'hidden',
        title: '???',
        teaser: '이 결말의 악보는 아직 배부되지 않았습니다. 조건은 비공개입니다.',
      },
    ],
  },

  // =========================================================================
  // Mission 9 — Stage 5 "거대한 구조" / 영화 오마주 (설국열차) / 리팩토링
  // =========================================================================
  {
    id: 's5-snowpiercer-01',
    stage: 5,
    stageTitle: '거대한 구조',
    missionType: '리팩토링',
    difficulty: 'Normal',
    scope: '모듈 경계',
    modes: ['developer'],
    domain: '영화 오마주',
    domainEmoji: '🎬',
    title: '달리는 열차의 벽 — 명부·배급·통행의 경계 다시 긋기',
    estimatedMinutes: 150,
    briefing: {
      title: '한 열차, 세 개의 세계',
      content: `### 같은 단어, 다른 세계

이 열차에서 "승객"이라는 단어는 세 가지 뜻으로 쓰입니다. 배급관리관에게 승객은 하루 배급량을 계산할 머릿수입니다. 보안총괄에게 승객은 위험 등급이 매겨진 관리 대상입니다. 명부관리자에게 승객은 태어나고 이동하고 기록되는 존재입니다. 셋은 같은 사람을 보면서 서로 다른 것을 봅니다.

소프트웨어 설계는 이 현상에 이름을 붙였습니다 — **바운디드 컨텍스트(bounded context)**. 같은 개념이라도 문맥마다 의미와 필요한 정보가 다르므로, 하나의 거대한 "승객" 모델을 전 시스템이 공유하는 대신 문맥마다 자기 모델을 갖고 경계에서는 계약으로만 대화하게 하자는 것입니다. 경계가 없으면 어느 팀의 사정이 곧바로 다른 팀의 장애가 됩니다.

### 콘웨이 법칙 — 조직도가 아키텍처를 그린다

1968년 멜빈 콘웨이는 "시스템의 구조는 그것을 만든 조직의 소통 구조를 닮는다"고 썼습니다. 배급팀과 보안팀이 회의 대신 서로의 장부를 몰래 뒤져 왔다면, 코드도 서로의 내부 데이터를 직접 뒤지고 있을 것입니다. 코드의 결합도는 종종 조직이 소통해 온 방식의 화석입니다.

### 멈출 수 없는 시스템

어느 영화에는 17년째 한 번도 멈추지 않고 달리는 열차가 나옵니다. 꼬리칸과 엔진칸 사이에 문과 통행증이 있고, 배급과 질서가 그 문에 걸려 있는 세계. 그 열차의 가장 무서운 제약은 계급이 아니라 이것입니다 — **열차는 정비를 위해 멈출 수 없다**. 당신이 인수인계받은 시스템도 같습니다. 운행을 세우지 않은 채, 달리는 열차 위에서 벽을 다시 세워야 합니다. 리팩토링에 "동작 보존"이라는 조건이 붙는 이유가 여기에 있습니다.`,
    },
    scenario: `당신은 '열차 운영 시스템'의 유지보수를 인수인계받았습니다. 전임자가 남긴 문서는 한 줄입니다 — "명부 배열 인덱스 순서 절대 바꾸지 말 것." 명부(Registry)·배급(Ration)·통행(Gate) 세 시스템이 한 코드베이스에서 서로의 내부 데이터를 직접 읽고 씁니다. 이번 분기 요구는 '작업 통행' — 정비 승객이 지정 시간대에 앞칸으로 이동할 수 있어야 합니다. 보안총괄은 규칙 추가를 원하고, 배급관리관은 자기 시스템이 건드려지는 것을 원하지 않으며, 두 사람 다 상대 팀 장애가 자기 팀 업무를 세우는 일이 반복되는 데 지쳐 있습니다.`,
    providedFiles: [],
    legacyFiles: [
      {
        path: 'src/main/java/com/train/registry/PassengerRegistry.java',
        content: `package com.train.registry;

import java.util.HashMap;
import java.util.Map;

/**
 * 승객 명부. 17년째 운영 중.
 * 배열 인덱스: [0]=이름 [1]=소속칸(TAIL/MID/FRONT) [2]=배급등급(A/B/C)
 *             [3]=위험등급(LOW/HIGH) [4]=배급상태(OK/SUSPENDED)
 * 주의: 배급팀과 보안팀이 이 Map을 직접 읽고 씁니다. 인덱스 순서를 바꾸지 마세요.
 *       (2019년에 한 번 바꿨다가 3일간 전원 배급이 정지된 적 있음)
 */
public class PassengerRegistry {

    public static final Map<String, String[]> PASSENGERS = new HashMap<>();

    static {
        PASSENGERS.put("P-1031", new String[] {"길만호", "TAIL", "C", "LOW", "OK"});
        PASSENGERS.put("P-2044", new String[] {"서예강", "MID", "B", "LOW", "OK"});
        PASSENGERS.put("P-2077", new String[] {"차오름", "MID", "B", "HIGH", "SUSPENDED"});
        PASSENGERS.put("P-2101", new String[] {"노들", "MID", "C", "LOW", "OK"});
        PASSENGERS.put("P-3001", new String[] {"모현", "FRONT", "A", "LOW", "OK"});
    }
}`,
      },
      {
        path: 'src/main/java/com/train/ration/RationService.java',
        content: `package com.train.ration;

import com.train.registry.PassengerRegistry;

/** 배급 시스템. 명부의 배열을 직접 읽고 쓴다. */
public class RationService {

    /** 등급별 하루 배급량(g)을 계산한다. */
    public int dailyRationOf(String passengerId) {
        String[] p = PassengerRegistry.PASSENGERS.get(passengerId);
        if (p[4].equals("SUSPENDED")) {
            return 0;
        }
        int base;
        switch (p[2]) {
            case "A": base = 600; break;
            case "B": base = 450; break;
            default: base = 300;
        }
        // 보안팀 요청(3년 전 구두 합의): 위험 등급이 높으면 30% 감량
        if (p[3].equals("HIGH")) {
            base = base * 70 / 100;
        }
        return base;
    }

    /** 배급 위반 시 정지 처리 — 명부 배열에 직접 기록한다. */
    public void suspend(String passengerId) {
        PassengerRegistry.PASSENGERS.get(passengerId)[4] = "SUSPENDED";
    }
}`,
      },
      {
        path: 'src/main/java/com/train/gate/GateControl.java',
        content: `package com.train.gate;

import com.train.ration.RationService;
import com.train.registry.PassengerRegistry;

/** 통행 승인 시스템. 명부와 배급의 사정을 전부 직접 안다. */
public class GateControl {

    private final RationService rationService = new RationService();

    /** targetSection으로의 통행을 승인할 수 있는가. */
    public boolean mayPass(String passengerId, String targetSection) {
        String[] p = PassengerRegistry.PASSENGERS.get(passengerId);

        // 꼬리칸은 앞으로 갈 수 없다
        if (p[1].equals("TAIL") && !targetSection.equals("TAIL")) {
            return false;
        }
        // 중간칸 -> 엔진칸(FRONT)은 심사 대상
        if (p[1].equals("MID") && targetSection.equals("FRONT")) {
            // 배급 정지자 통행 금지 (배급팀 내부 상태를 직접 확인)
            if (p[4].equals("SUSPENDED")) {
                return false;
            }
            // 배급량이 적은 승객은 위험 승객으로 간주한다 (2021년 임시 조치)
            if (rationService.dailyRationOf(passengerId) < 400) {
                return false;
            }
            return true;
        }
        return p[1].equals(targetSection);
    }

    /** 무단 통행 적발 — 위험 등급을 올리고 배급을 정지시킨다. */
    public void reportViolation(String passengerId) {
        PassengerRegistry.PASSENGERS.get(passengerId)[3] = "HIGH";
        rationService.suspend(passengerId);
    }
}`,
      },
      {
        path: 'src/main/java/com/train/TrainOps.java',
        content: `package com.train;

import com.train.gate.GateControl;
import com.train.ration.RationService;

/** 운영 콘솔. 아침 점호 때 실행한다. */
public class TrainOps {

    public static void main(String[] args) {
        RationService ration = new RationService();
        GateControl gate = new GateControl();

        System.out.println("P-1031 배급: " + ration.dailyRationOf("P-1031") + "g");
        System.out.println("P-2044 배급: " + ration.dailyRationOf("P-2044") + "g");
        System.out.println("P-2077 배급: " + ration.dailyRationOf("P-2077") + "g");
        System.out.println("P-2101 배급: " + ration.dailyRationOf("P-2101") + "g");
        System.out.println("P-2044 -> FRONT: " + gate.mayPass("P-2044", "FRONT"));
        System.out.println("P-2077 -> FRONT: " + gate.mayPass("P-2077", "FRONT"));
        System.out.println("P-2101 -> FRONT: " + gate.mayPass("P-2101", "FRONT"));
        System.out.println("P-1031 -> MID: " + gate.mayPass("P-1031", "MID"));
    }
}`,
      },
    ],
    requirements: [
      "신규 '작업 통행': 명부에 정비조로 등록된 중간칸 승객은 작업 시간대(06시 이상 10시 미만)에 한해 엔진칸(FRONT) 통행이 허용됩니다. 시간대 밖에는 기존 규칙이 그대로 적용됩니다. 정비조 명단은 명부가 관리합니다 — 이번 분기 정비조는 노들(P-2101)입니다.",
      '동작 보존 검증: 아침 점호 결과는 리팩토링 후에도 동일해야 합니다 — 배급 P-1031 300g, P-2044 450g, P-2077 0g, P-2101 300g / 통행 P-2044→FRONT 허용, P-2077→FRONT 거부, P-2101→FRONT 거부, P-1031→MID 거부. 작업 통행 적용 후: P-2101의 FRONT 요청은 08시에 허용, 12시에 거부.',
      '배급 시스템이 멈춘 날에도 통행 승인은 계속되어야 합니다. 그 반대도 마찬가지입니다.',
      '보안팀은 승객의 배급 내역을 볼 권한이 없고, 배급팀은 위험 등급을 매길 권한이 없습니다. 각 시스템은 자기 업무에 필요한 것만, 정해진 창구로 물어봅니다.',
      '명부는 하나입니다. 같은 승객이 배급 시스템과 통행 시스템에서 서로 다른 상태로 기억되어서는 안 됩니다.',
      '보안총괄 요청: "정비조라도 위험한 승객은 곤란합니다. 적당히 걸러 주세요." (어디부터가 "적당히"인지는 회의 때마다 다릅니다)',
    ],
    constraints: [
      '리팩토링 미션입니다 — 요구사항 2의 점호 결과가 어긋나는 순간 그것은 개선이 아니라 사고입니다.',
      '빅뱅 재작성 금지. 매 단계에서 시스템이 돌아가는 상태를 유지하며 옮기세요. 열차는 정비를 위해 멈추지 않습니다.',
      '외부 프레임워크 없이 순수 Java 17로 작성합니다. 모듈 경계는 패키지와 인터페이스로 표현하세요.',
      '엔진칸 내부 코드는 건드릴 수 없습니다. 엔진은 신성합니다. 전임자 주석에도 그렇게 적혀 있습니다.',
    ],
    learningGoals: [
      '바운디드 컨텍스트를 코드 수준에서 경험하기 — 같은 "승객"이 문맥마다 다른 모델이 되는 이유',
      '공개된 내부 자료구조(public Map)를 계약(인터페이스) 뒤로 숨기는 점진적 절차',
      '모듈 간 장애 격리 — 한 시스템의 다운이 다른 시스템을 세우지 않는 구조',
      '규칙의 주인 찾기 — 이 판단은 어느 모듈의 책임인가를 묻는 습관',
    ],
    hints: [
      '각 시스템이 승객에 대해 실제로 묻는 질문을 목록으로 적어 보세요. 배급은 "등급과 정지 여부", 통행은 "소속 칸과 통행 제한 여부"만 궁금합니다. 그 목록이 곧 명부가 답해야 할 계약입니다.',
      'public Map을 없애는 것이 아니라 감싸는 것부터 시작하세요. 호출부를 하나씩 계약 뒤로 옮기고, 마지막 직접 접근이 사라진 뒤에야 내부 구조를 바꿉니다. 순서가 반대면 열차가 섭니다.',
      '게이트의 "배급량 400g 미만 차단"은 원래 무엇을 걸러 내려던 규칙이었을까요. 배급량은 등급과 위험도의 그림자일 뿐입니다. 규칙의 원래 의미를 되살려 주인 모듈에게 돌려주되, 현재 승객들에 대한 결과는 그대로여야 합니다.',
    ],
    hiddenCases: [
      {
        title: '명부에 없는 승객의 통행 요청',
        description:
          '존재하지 않는 ID(P-9999)로 통행을 요청하면 현재 코드는 NullPointerException으로 즉사합니다. 게이트 프로세스가 죽으면 전 열차의 통행 심사가 멈추고, 예외를 대충 삼키면 유령이 엔진칸에 들어갑니다. 좋은 방어: 경계에서 "미등록 승객"을 명시적 거부 사유로 다루세요. 명부에 없다는 것도 하나의 답입니다.',
      },
      {
        title: '두 모듈이 기억하는 서로 다른 승객',
        description:
          '모듈을 나누다 보면 각자 승객 사본이나 캐시를 갖고 싶어집니다. 배급 모듈에서 정지 처리된 승객을 통행 모듈이 옛 상태로 기억하면, 배급 정지자가 엔진칸을 활보합니다. 좋은 방어: 승객 상태의 단일 진실 공급원을 정하고, 나머지 모듈은 보관하지 말고 물어보게 하세요. 정합성 붕괴는 코드가 아니라 사본에서 시작됩니다.',
      },
      {
        title: '순환 참조 — 서로를 부르는 두 칸',
        description:
          '게이트는 위반자의 위험 등급을 올리고 배급을 정지시키며, 배급은 위험 등급을 읽어 감량합니다. 이대로 모듈을 자르면 Gate→Ration→Registry←Gate의 순환 고리가 컴파일 의존성으로 드러납니다. 좋은 방어: "위반 사건이 일어났다"는 사실과 "그래서 각 모듈이 무엇을 할지"를 분리하세요. 순환은 대개 사건과 반응을 한 호출에 욱여넣을 때 생깁니다.',
      },
    ],
    rubric: [
      {
        name: '모듈 경계와 계약 설계',
        description: '명부·배급·통행이 내부 자료구조가 아니라 계약(인터페이스)으로 대화하는가. 각 모듈이 필요한 것만 아는가.',
        weight: 30,
        visibleToLearner: true,
      },
      {
        name: '동작 보존',
        description: '아침 점호의 검증 결과가 리팩토링 전후로 동일한가. 이를 보증하는 테스트가 리팩토링 전에 마련되었는가.',
        weight: 25,
        visibleToLearner: true,
      },
      {
        name: '의존 방향과 정보 은닉',
        description: '순환 의존이 제거되고 의존 방향이 한쪽으로 정리되었는가. public 자료구조 직접 접근이 사라졌는가.',
        weight: 20,
        visibleToLearner: true,
      },
      {
        name: '작업 통행 구현 정확성',
        description: '시간대 경계(06시 포함, 10시 미포함)와 정비조 판정이 명세대로 동작하며, 기존 규칙과의 우선순위가 명확한가.',
        weight: 15,
        visibleToLearner: true,
      },
      {
        name: '모호한 요구사항 확인',
        description: '"적당히 걸러 주세요"의 기준을 임의 확정하지 않고 질문했거나 가정을 명시했는가.',
        weight: 10,
        visibleToLearner: false,
      },
    ],
    explainTask: {
      audience: '꼬리칸 대표 (통행증 제도가 바뀔 때마다 가장 먼저 의심하는 사람)',
      prompt:
        '꼬리칸 대표에게 설명해 주세요. (1) 이번 개편에서 통행 규칙 자체는 무엇 하나 바뀌지 않는다는 것 — 바뀌는 것은 규칙을 지키는 방식이라는 것, (2) 꼬리칸 입장에서 무엇이 좋아지는지 — 배급 시스템이 고장 난 날에도 통행 심사가 멈추지 않고, 배급 담당자가 위험 등급을 마음대로 볼 수 없게 된다는 것, (3) "각 팀이 필요한 것만 안다"는 원칙이 감시의 축소이지 확대가 아닌 이유. 상대는 시스템을 믿지 않는 사람입니다. 기술 용어 없이, 의심을 존중하면서 설득하세요.',
    },
    endings: [
      {
        grade: 'calm',
        title: '아무도 눈치채지 못한 개편',
        teaser: '작업 통행은 예정일에 조용히 열렸다. 배급 시스템이 점검으로 멈춘 목요일에도 게이트는 평소처럼 열리고 닫혔고, 그 사실을 알아챈 사람은 당신뿐이다.',
      },
      {
        grade: 'hotfix',
        title: '무전기 운영 체제',
        teaser: '게이트는 돌아간다. 다만 배급 점검일마다 보안총괄이 무전으로 수동 개방을 지시하고, 그 무전 내역이 매주 당신의 할 일 목록으로 돌아온다.',
      },
      {
        grade: 'dawn',
        title: '3호차의 아침',
        teaser: '배급 모듈 장애가 게이트를 함께 세웠다. 출근 시간대 통로에 갇힌 정비조 명단이 사후 보고서 부록 A가 되고, 부록 B는 당신의 커밋 목록이다.',
      },
      {
        grade: 'hidden',
        title: '???',
        teaser: '이 결말로 가는 문은 아직 열리지 않았습니다. 조건은 비공개입니다.',
      },
    ],
  },

  // =========================================================================
  // Mission 10 — Stage 6 "구조로 세상 읽기" / 도서관·분류 / 설계 리뷰
  // =========================================================================
  {
    id: 's6-dewey-01',
    stage: 6,
    stageTitle: '구조로 세상 읽기',
    missionType: '설계 리뷰',
    difficulty: 'Normal',
    scope: '여러 파일',
    modes: ['developer'],
    domain: '도서관·분류',
    domainEmoji: '📚',
    title: '설계 리뷰 — 세계를 열 칸에 넣으려는 사람들에게',
    estimatedMinutes: 120,
    briefing: {
      title: '1876년, 세계를 열 칸에 넣은 남자',
      content: `### 십진법의 야심

1876년, 미국의 사서 멜빌 듀이는 세계의 모든 지식을 10개의 칸으로 나누는 체계를 발표했습니다. 000 총류, 100 철학, 200 종교, 300 사회과학, 그리고 900 역사까지. 각 칸은 다시 10칸으로, 그 칸은 또 10칸으로 나뉩니다. 듀이 십진분류(DDC)는 오늘날까지 전 세계 도서관에서 가장 널리 쓰이는 분류법입니다. 도서관 책등에 붙은 숫자가 바로 그것입니다.

### 체계는 미래를 예측하지 못한다

듀이가 체계를 만들 때 컴퓨터는 없었습니다. 그래서 20세기에 태어난 컴퓨터과학은 갈 곳이 없어 000 "총류"의 틈새(004~006)에 낑겨 들어갔습니다. 세계에서 가장 큰 지식 산업 하나가 백과사전과 신문 옆에서 셋방살이를 하는 셈입니다. 어떤 분류 체계든 만들어진 순간의 세계를 박제합니다 — 그리고 세계는 계속 바뀝니다.

### 분류는 세계관이다

DDC의 종교(200번대)는 열 칸 중 여덟 칸 이상이 기독교의 몫입니다. 1876년 미국 사서의 눈에 비친 세계가 그랬기 때문입니다. 분류는 중립적인 정리 기술이 아니라 무엇이 중심이고 무엇이 "기타"인지에 대한 선언입니다. 그래서 분류 체계를 리뷰한다는 것은 번호 체계를 검사하는 일이 아니라, 그 체계가 세계를 어떻게 보고 있는지, 그 시선이 10년 뒤에도 유효한지를 묻는 일입니다.

### 이번에는 코드를 고치지 않습니다

당신은 사내 TF가 만든 문서 분류 체계 설계안을 읽고, 그 설계가 어떤 미래를 견디지 못하는지 찾아 글로 씁니다. 듀이의 체계는 150년을 버텼지만 컴퓨터과학의 등장을 예측하지 못했습니다. 이 설계안은, 다음 조직 개편을 버틸 수 있을까요.`,
    },
    scenario: `사내 문서관리 TF가 6개월간 만든 '전사 문서 분류 체계 설계안 v0.9'가 다음 주 경영진 보고를 앞두고 있습니다. TF 팀장이 당신에게 사전 리뷰를 요청했습니다 — "통과의례 같은 거예요. 편하게 봐 주세요." 설계안은 자신감이 넘치고, 문장은 매끄럽고, 표는 정갈합니다. 다만 당신은 압니다. 설계 문서에서 가장 위험한 문장은 틀린 문장이 아니라, 아무도 반박하지 않은 문장이라는 것을.`,
    providedFiles: [],
    legacyFiles: [
      {
        path: 'docs/DESIGN.md',
        content: `# 전사 문서 분류 체계 설계안 (v0.9 — 검토용)

작성: 문서관리 TF (2026-06)

## 1. 목표

전사에 흩어진 문서(추정 12만 건)에 단일한 분류와 식별자를 부여한다.
분류 체계는 한 번 확정 후 최소 10년 유지를 목표로 한다.

## 2. 대분류 (조직 구조 기반)

현행 조직도를 기준으로 대분류 9개와 기타 1개를 둔다.
부서 담당자가 자기 부서 문서를 즉시 분류할 수 있다는 것이 본 체계의 최대 강점이다.

| 코드 | 대분류 | 주관 조직 |
|---|---|---|
| 10 | 경영일반 | 경영지원본부 |
| 20 | 인사 | 인사팀 |
| 30 | 재무·회계 | 재무본부 |
| 40 | 법무 | 법무실 |
| 50 | 영업 | 영업본부 |
| 60 | 구매·조달 | 구매팀 |
| 70 | 생산·품질 | 생산본부 |
| 80 | 연구개발 | 기술연구소 |
| 90 | 홍보·대외 | 커뮤니케이션실 |
| 99 | 기타 | (미지정) |

## 3. 분류 규칙

- 모든 문서는 정확히 하나의 대분류에 속한다.
- 구매 계약서처럼 성격이 겹치는 문서(재무? 법무? 구매?)는 작성 부서의 판단에 따라 분류한다.
- 분류가 애매하면 99(기타)로 분류한다. 추후 여유가 있을 때 재분류한다.

## 4. 문서 ID 규칙

문서 ID에 분류 코드를 포함해, ID만 보고도 문서의 성격을 알 수 있게 한다 (본 체계의 두 번째 강점).

형식: 대분류(2자리)-부서코드(3자리)-연도(4자리)-일련번호(5자리)
예: 30-FIN-2026-00042 (재무본부가 2026년에 등록한 42번째 재무·회계 문서)

문서 ID는 전자결재, 메일, 계약서 각주 등 전 시스템에서 문서를 지칭하는 공식 식별자로 사용한다.

## 5. 재분류

문서가 재분류되면 새 분류 코드로 ID를 재발급하고, 구 ID는 폐기한다.
(재분류는 드물 것으로 예상되어 상세 절차는 생략한다)`,
      },
      {
        path: 'src/main/java/com/daehan/docs/Category.java',
        content: `package com.daehan.docs;

/** 대분류. 조직 개편 시 이 enum을 함께 개정한다. */
public enum Category {
    GENERAL(10, "경영일반"),
    HR(20, "인사"),
    FINANCE(30, "재무·회계"),
    LEGAL(40, "법무"),
    SALES(50, "영업"),
    PROCUREMENT(60, "구매·조달"),
    PRODUCTION(70, "생산·품질"),
    RND(80, "연구개발"),
    PR(90, "홍보·대외"),
    ETC(99, "기타");

    private final int code;
    private final String label;

    Category(int code, String label) {
        this.code = code;
        this.label = label;
    }

    public int code() { return code; }
    public String label() { return label; }
}`,
      },
      {
        path: 'src/main/java/com/daehan/docs/DocumentId.java',
        content: `package com.daehan.docs;

/**
 * 문서 ID. 형식: 대분류(2)-부서(3)-연도(4)-일련(5)
 * ID만 보고 문서의 성격을 알 수 있다는 것이 본 설계의 자랑이다.
 */
public record DocumentId(Category category, String deptCode, int year, int serial) {

    public String formatted() {
        return String.format("%02d-%s-%04d-%05d", category.code(), deptCode, year, serial);
    }

    /** ID 문자열에서 분류를 복원한다 — 어느 시스템이든 ID만 있으면 분류를 안다. */
    public static Category categoryOf(String documentId) {
        int code = Integer.parseInt(documentId.substring(0, 2));
        for (Category c : Category.values()) {
            if (c.code() == code) {
                return c;
            }
        }
        return Category.ETC;   // 모르는 코드는 일단 기타로
    }

    /** 재분류: 새 분류로 ID를 다시 발급한다. 구 ID는 폐기한다. */
    public DocumentId reclassify(Category newCategory) {
        return new DocumentId(newCategory, deptCode, year, serial);
    }
}`,
      },
    ],
    requirements: [
      '산출물은 critique.md 한 편입니다. 설계안(DESIGN.md)과 코드 두 파일을 함께 읽고, 지적마다 설계안의 해당 문장이나 코드를 근거로 인용하세요.',
      '결함을 3개 이상 찾으세요. 각 결함에는 "언제, 어떤 사건이 일어나면, 어떤 사고로 이어지는지" 시나리오가 반드시 붙어야 합니다. "나쁘다"가 아니라 "터진다"를 쓰세요.',
      '각 결함에 대안을 1개 이상 제시하세요. 단, 전체 대안 중 최소 1개는 분류 체계나 코드를 바꾸지 않고 운영(절차·정책·담당자 규칙)으로 해결하는 옵션이어야 합니다.',
      '결함에 우선순위를 매기세요 — "도입 전에 반드시 고칠 것"과 "도입 후에 개선해도 되는 것"을 구분하고 이유를 적으세요.',
      '설계안이 스스로 "강점"이라고 내세운 항목 중 실제로는 비용인 것이 있는지 검토하세요.',
      '경영진 의견: "분류는 한 번 정하면 10년은 가야 합니다." (무엇이 10년을 가야 하는지는 회의록마다 다릅니다)',
    ],
    constraints: [
      '설계 리뷰 미션입니다 — 코드 수정과 대체 설계안 전체 작성은 범위 밖입니다. 산출물은 critique.md 하나입니다.',
      '모든 지적에는 근거 인용과 사고 시나리오가 붙어야 합니다. "느낌상 위험해 보임"은 리뷰가 아니라 점괘입니다.',
      '결함의 개수보다 치명도 판단이 평가됩니다. 사소한 지적 열 개보다 치명적인 지적 세 개가 낫습니다.',
      '"제가 했으면 이렇게 안 했죠"는 리뷰 용어가 아닙니다. TF도 6개월 전의 자신에게 하고 싶은 말입니다.',
    ],
    learningGoals: [
      '설계 문서를 비판적으로 읽기 — 매끄러운 문장 뒤의 깨지기 쉬운 가정 찾기',
      '식별자에 의미를 넣는 설계(스마트 키)의 장기 비용 이해 — 주민등록번호 지역코드의 교훈',
      '분류 체계와 조직 구조를 결합할 때 생기는 취약성 인식 — 콘웨이의 저주',
      '설계를 바꾸지 않고 운영으로 문제를 흡수하는 대안을 사고 목록에 넣기',
      '비평을 채택 가능한 형태로 쓰는 기술 — 우선순위, 근거, 시나리오',
    ],
    hints: [
      '결함은 문서 안이 아니라 미래에서 발견됩니다. 설계안에 사건을 하나씩 던져 보세요 — "조직 개편이 났다", "문서가 재분류됐다", "3년 치 문서가 쌓였다". 어떤 문장이 부러지는지 보세요.',
      'DocumentId.categoryOf()를 호출할 시스템들을 상상해 보세요. ID를 복사해 간 메일, 계약서 각주, 외부 시스템은 재발급 공지를 받지 못합니다. 식별자의 첫 번째 의무는 똑똑함이 아니라 불변입니다.',
      '주민등록번호 뒷자리에는 한때 출생 지역 코드가 들어 있었습니다. 2020년에 그 코드가 왜, 어떤 비용을 치르고 사라졌는지 찾아보세요. 설계안 4장이 다르게 읽힐 겁니다.',
    ],
    hiddenCases: [
      {
        title: '기타(99)의 블랙홀화',
        description:
          '설계안 3장은 "애매하면 기타로, 여유가 있을 때 재분류"를 명시합니다. 그 여유는 오지 않습니다. 잔여 카테고리는 분류를 미루는 가장 싼 방법이므로 해마다 부풀어, 몇 년 뒤 최대 분류가 "기타"인 체계가 됩니다. 분류 체계의 죽음은 대개 틀린 분류가 아니라 잔여 칸의 비만으로 시작됩니다.',
      },
      {
        title: 'categoryOf()의 침묵',
        description:
          'DocumentId.categoryOf()는 모르는 코드를 만나면 예외를 던지는 대신 기타(ETC)를 반환합니다. 체계 개정으로 새 대분류 코드가 생기는 순간, 개정을 배포받지 못한 구버전 시스템들이 새 문서를 전부 조용히 "기타"로 읽습니다. 오류가 아니라 오분류라서 로그도 알람도 없습니다 — 통계가 이상하다는 소문이 돌 때쯤엔 몇 달치입니다.',
      },
      {
        title: '"생략한다"는 문장',
        description:
          '설계안 5장의 "재분류는 드물 것으로 예상되어 상세 절차는 생략한다"가 실은 가장 큰 결함입니다. 조직 개편 한 번이면 재분류는 수만 건 단위로 일어나고, 그 순간 "재분류 시 ID 재발급" 정책과 결합해 전 시스템의 참조가 한꺼번에 깨집니다. 설계 문서에서 "생략한다"는 종종 "가장 어려워서 미뤘다"의 동의어입니다.',
      },
    ],
    rubric: [
      {
        name: '결함 발견 (치명도 가중)',
        description: '심어진 결함을 찾았는가. 치명적인 결함(ID 인코딩, 조직도 결합)일수록 높은 배점. 스스로 찾은 정당한 결함도 인정.',
        weight: 35,
        visibleToLearner: true,
      },
      {
        name: '근거의 구체성',
        description: '각 지적이 설계안의 문장·코드 인용과 "언제 어떤 사고로 터지는지" 시나리오를 갖추었는가.',
        weight: 20,
        visibleToLearner: true,
      },
      {
        name: '대안의 실행가능성',
        description: '대안이 12만 건 문서와 진행 중인 일정이라는 현실 위에서 실행 가능한가. 운영으로 해결하는 옵션이 포함되었는가.',
        weight: 20,
        visibleToLearner: true,
      },
      {
        name: '글의 명료성과 설득 구조',
        description: '우선순위가 분명하고, 읽는 사람이 다음에 무엇을 하면 되는지가 명확한 비평인가.',
        weight: 15,
        visibleToLearner: true,
      },
      {
        name: '모호한 요구사항 확인',
        description: '"10년은 가야 합니다"에서 무엇이 10년을 가야 하는지(ID? 분류 트리? 문서?)를 되물었거나 가정을 명시했는가.',
        weight: 10,
        visibleToLearner: false,
      },
    ],
    explainTask: {
      audience: '분류 체계를 만든 TF 팀장 (6개월을 갈아 넣었고, 다음 주 경영진 보고를 앞둔 사람)',
      prompt:
        '발견한 결함 중 가장 치명적인 하나를 골라 TF 팀장에게 전하는 글을 쓰세요. (1) 설계안이 잘한 점을 구체적으로 먼저 짚고, (2) 결함을 "당신의 실수"가 아니라 "앞으로 일어날 사건"으로 서술하고, (3) 대안이 팀장의 경영진 보고를 오히려 튼튼하게 만드는 방향임을 보여 주세요. 목표는 논쟁에서 이기는 것이 아니라 설계가 고쳐지는 것입니다. 상대가 방어적으로 변하는 순간, 기술적으로 옳은 리뷰도 실패합니다.',
    },
    endings: [
      {
        grade: 'calm',
        title: '개정 이력의 한 줄',
        teaser: '설계안은 v1.0으로 조용히 배포되고, 당신의 리뷰는 "검토 의견 반영"이라는 개정 이력 한 줄로 남는다. 10년 뒤에도 문서 ID는 바뀌지 않는다.',
      },
      {
        grade: 'hotfix',
        title: '분기마다 정리의 날',
        teaser: '체계는 도입됐다. 분기마다 "기타(99) 문서 정리의 날" 공지가 전사 메일로 오고, 협조자 명단 첫 줄에 당신의 이름이 있다.',
      },
      {
        grade: 'dawn',
        title: '전사 공지: 문서 ID 일괄 변경 안내',
        teaser: '조직 개편과 함께 12만 건의 ID가 재발급되고, 깨진 링크 제보 채널이 개설된다. 채널 공지사항에는 당신의 리뷰가 "검토 완료"로 인용되어 있다.',
      },
      {
        grade: 'hidden',
        title: '???',
        teaser: '이 결말의 서가는 아직 비어 있습니다. 조건은 비공개입니다.',
      },
    ],
  },
];

const sampleReviews = {
  's1-wine-01': {
    overall: 66,
    summary:
      '책임을 나누려는 방향은 정확했고 페어링 규칙 분리는 특히 좋았습니다. 다만 데이터와 점수 계산이 아직 한 클래스에 붙어 있고, 병렬 배열이 그대로 남아 있어 "타입으로 도메인을 말한다"는 단계까지는 가지 못했습니다. 동작 보존 검증을 수동 실행에 의존한 점, 모호한 예산 규칙을 질문 없이 임의 확정한 점이 감점 요인입니다.',
    items: [
      {
        rubricName: '책임 분리',
        score: 20,
        evidence:
          'class PairingRule { int bonus(String food, String grape) { ... } } / class ResultFormatter { String format(...) }',
        feedback:
          '페어링 규칙과 결과 포맷팅을 별도 클래스로 뽑아낸 것은 정확한 판단입니다. 다만 WineRecommender 안에 여전히 입력 파싱, 와인 배열, 점수 계산, 할인 로직이 함께 살고 있습니다. 특히 할인은 요구사항에서 "명절마다 바뀐다"고 명시된 부분인데 recommend() 하단에 그대로 남아 있어, 다음 수정 요청이 오면 또 이 클래스를 열어야 합니다.',
      },
      {
        rubricName: '도메인 개념의 타입화',
        score: 9,
        evidence: 'String[] names = {...}; int[] bodies = {...}; // 배열은 유지하고 접근 메서드만 추가',
        feedback:
          '병렬 배열이 private으로 숨겨지긴 했지만 여전히 5개 배열이 인덱스로 동기화되어 있습니다. Wine이라는 레코드(record Wine(String name, String grape, int body, int sweetness, int price))를 도입하면 배열 하나가 어긋나는 사고 자체가 불가능해지고, DB 전환 요구사항에도 자연스럽게 대비됩니다. 입력값 다섯 개도 TastePreference로 묶을 수 있었습니다.',
      },
      {
        rubricName: '동작 보존',
        score: 17,
        evidence: 'public static void main(String[] args) { System.out.println(new WineRecommender().recommend("바디=5;...")); }',
        feedback:
          '리팩토링 전후 결과를 main으로 직접 비교한 흔적이 보이고, 실제로 제출 코드의 출력은 원본과 일치했습니다. 다만 케이스가 3개뿐이고 수동 비교입니다. 예산 경계(budget+10000 정확히), 페어링 미매칭 음식, VIP 고가 쿠폰 경계(80000원) 같은 갈림길마다 케이스를 두고 JUnit으로 고정했다면 만점이었습니다.',
      },
      {
        rubricName: '가독성과 네이밍',
        score: 11,
        evidence: 'private static final int BODY_EXACT_SCORE = 30; ... if (prices[i] <= budget + 10000)',
        feedback:
          '점수 가중치를 상수로 올린 것은 좋습니다. 그런데 가장 위험한 매직 넘버인 10000(예산 초과 허용폭)과 80000(쿠폰 기준가)이 조건식 안에 그대로 남았습니다. 숫자에 이름을 붙이는 기준은 "크기"가 아니라 "업무적 의미의 무게"입니다. BUDGET_TOLERANCE 같은 이름이 붙는 순간 영업팀과 대화할 수 있는 코드가 됩니다.',
      },
      {
        rubricName: '모호한 요구사항 확인',
        score: 9,
        evidence: '// 예산 초과 허용은 기존과 동일하게 1만원으로 유지',
        feedback:
          '"조금 초과"의 정의가 없다는 사실을 주석으로 인지한 점은 평가합니다. 하지만 요구사항에 "협의된 문서가 없다"고까지 적혀 있었으니, 이는 개발자가 확정할 값이 아니라 영업팀에 되물어야 할 값입니다. 실무에서는 "기존 코드가 1만원이므로 유지하되, 정책 확정 필요"라고 질문 목록에 올리는 것까지가 한 세트입니다.',
      },
    ],
    nextSteps: [
      'Wine을 record로 도입하고 병렬 배열을 List<Wine>으로 교체해 보세요. 그 순간 점수 계산 코드가 얼마나 읽기 좋아지는지 확인해 보세요.',
      '할인 로직을 DiscountPolicy로 분리하고, "GOLD 10%, VIP 15%+쿠폰"을 정책 객체의 문제로 만들어 보세요.',
      '경계값 5개(예산 정확히 일치, +10000 정확히, 페어링 없음, 80000원 정확히, 알 수 없는 등급)를 JUnit 테스트로 고정한 뒤 다시 한 번 구조를 바꿔 보세요. 테스트가 있을 때 리팩토링의 심리적 비용이 어떻게 달라지는지 느끼는 것이 이번 스테이지의 숨은 목표입니다.',
    ],
    followUpQuestions: [
      '와인 데이터가 DB로 옮겨진다면, 지금 구조에서 정확히 어떤 클래스의 어떤 줄이 바뀌나요? 하나도 안 바뀐다고 말할 수 있는 구조로 만들려면 무엇이 더 필요한가요?',
      'PairingRule을 분리하셨는데, 만약 "특정 와인 상품 단위의 페어링 예외"가 생긴다면 지금 설계에서 어디가 부러질까요?',
      '점수 계산 클래스와 할인 클래스 중 하나만 인터페이스로 승격해야 한다면 어느 쪽을 고르시겠어요? 그 판단 기준은 무엇인가요?',
    ],
    hiddenCases: [
      {
        title: '예산 0원 손님',
        passed: true,
        note: '파싱 직후 예산이 0 이하이면 IllegalArgumentException을 던지는 검증이 있어 통과했습니다. 잘못된 입력이 그럴듯한 추천 결과로 둔갑하는 경로를 입구에서 끊은 정확한 방어입니다.',
      },
      {
        title: 'G0LD 회원의 침묵',
        passed: false,
        note: 'grade.equals("GOLD") 문자열 비교가 그대로 남아 "G0LD"는 에러 없이 무할인 처리됐습니다. 등급을 enum으로 변환하고 변환 실패를 명시적으로 다뤘다면 막혔을 케이스입니다.',
        warStory: '실서비스에서도 쿠폰·등급 코드 오타가 소리 없이 무할인으로 흘러, 개발팀보다 CS팀이 먼저 장애를 발견하는 사례가 반복됩니다.',
      },
      {
        title: '메뉴에 없는 음식',
        passed: false,
        note: 'switch의 default가 여전히 무음 통과라 "굴전"은 페어링 0점인 채 왜곡된 추천이 나갑니다. 지원 음식 목록을 한 곳에서 관리하고 "페어링 미반영"을 결과에 명시했어야 합니다.',
      },
    ],
    scenario: `**배포 +3일.** 아무 일도 일어나지 않는다. 모니터링 그래프는 평평하고, 당신은 병렬 배열을 그대로 둔 것을 거의 잊는다. 평온은 언제나 관찰의 부재와 구분되지 않는다.

**배포 +11일.** 총무팀 김 과장이 모바일에서 등급을 입력하다 "G0LD"를 찍는다. 시스템은 에러 없이, 로그 한 줄 없이 정가 88,000원을 안내한다. 김 과장은 "골드 혜택 별거 없네"라고 중얼거리며 조용히 창을 닫는다. 항의하는 사용자는 코드를 고칠 기회를 주지만, 말없이 떠나는 사용자는 분기 지표로만 돌아온다. 그날 당신의 대시보드는 여전히 평화로웠다.

**배포 +34일. 설 연휴 D-14.** 운영팀 메일이 도착한다. "떡국이랑 갈비찜 페어링 추가해 주세요." 당신은 PairingRule을 열고 두 줄을 넣는다. 10분, 커밋 하나, 다른 파일은 손대지 않았다. 분리해 둔 사람에게만 허락되는 종류의 오후. 당신은 처음으로 리팩토링이 미래에 보낸 선물이었다는 걸 실감한다.

**배포 +35일.** 여운이 가시기 전에 두 번째 메일. "VIP 위에 VVIP 등급 신설합니다. 할인율 20%." 당신은 recommend() 하단으로 스크롤한다. 그 할인 블록, 그대로 있다. else if를 하나 더 붙인 diff에 리뷰어가 남긴 코멘트는 한 단어였다. "또요?"

**배포 +36일.** 퇴근길, 당신은 메모장에 클래스 이름 하나를 적는다. DiscountPolicy. 바뀌는 것에게 제 방을 내어 주는 법 — 다음 미션에서 배우게 될 이야기다.`,
    ending: { grade: 'hotfix', title: '명절마다 열리는 파일' },
  },
};

const sampleExplainFeedback = {
  's1-wine-01': {
    transcript:
      '제가 만든 추천 시스템은 소믈리에님이 손님 응대하시는 거랑 비슷하게 나눠져 있어요. 먼저 손님 취향을 듣는 부분이 있고, 와인 리스트가 따로 있고, 점수를 매기는 부분이 있습니다. 점수는 바디랑 당도가 맞으면 올라가고 예산 넘으면 깎여요. 그리고 인터페이스라는 걸 써서 페어링 규칙을 분리했기 때문에 규칙이 바뀌어도 괜찮습니다. 그래서 명절에 페어링을 바꾸고 싶으시면 그 파일만 고치면 돼요. 할인은 등급별로 퍼센트가 다른데 그것도 따로 있어서 괜찮고요. 결론적으로 전체 구조가 깔끔해져서 유지보수가 쉬워졌습니다.',
    feedback: {
      structure:
        '도입(비유 선언) → 구성 요소 나열 → 결론의 뼈대는 갖췄습니다. 하지만 청자의 관심사인 "내가 규칙을 바꾸고 싶을 때 무슨 일이 벌어지는가"가 다섯 번째 문장에야 나옵니다. 비개발자 대상 설명은 상대의 용건(페어링 규칙 변경)을 첫 문장에 놓고, 구조 설명을 그 근거로 붙이는 역순 구성이 훨씬 강합니다.',
      clarity:
        '두 군데 논리 비약이 있습니다. (1) "인터페이스라는 걸 써서 ~ 바뀌어도 괜찮습니다"는 수단과 효과 사이 연결 고리(규칙이 교체 가능한 부품이 됐다는 것)를 건너뛰었고, 인터페이스라는 용어를 풀지 않고 지나갔습니다. (2) "그래서 깔끔해져서 유지보수가 쉬워졌습니다"는 앞 문장들과 인과가 닿지 않는 상투적 마무리입니다. "괜찮다", "깔끔하다" 같은 뭉뚱그린 표현 대신 "어디를, 몇 군데, 누가 고치는가"로 말하면 비약이 사라집니다.',
      analogy:
        '"소믈리에 응대와 비슷하다"고 선언만 하고 실제 대응을 한 번도 짝지어 주지 않았습니다. 비유는 선언이 아니라 매핑입니다. 취향 청취=주문 파싱, 셀러(와인 저장고)=와인 목록, 머릿속 궁합 노트=페어링 규칙처럼 1:1로 짚어야 청자가 비유를 타고 구조까지 도달합니다. 특히 청자가 소믈리에 출신이므로 이 비유는 조금만 다듬으면 최고의 무기가 됩니다.',
      improved:
        '"기획자님이 제일 자주 하실 일이 명절 페어링 규칙 바꾸기라고 들었어요. 결론부터 말씀드리면, 이제 그 작업은 \'궁합 노트\' 파일 하나만 고치면 끝납니다. 왜 그런지 설명드릴게요. 소믈리에님이 손님을 응대할 때 취향을 듣고, 셀러의 리스트를 떠올리고, 머릿속 궁합 노트로 후보를 추리고, 마지막에 가격을 안내하시잖아요. 코드도 똑같이 네 부분으로 나눴습니다. 취향을 알아듣는 부분, 와인 리스트, 궁합 노트, 가격·할인 계산기요. 예전에는 이 네 가지가 한 페이지에 뒤섞여 있어서 궁합 하나 바꾸려다 가격 계산을 건드리는 사고가 날 수 있었는데, 지금은 서로 \'주고받는 것\'만 약속되어 있고 내용물은 독립적입니다. 그래서 설 연휴에 \'떡국엔 샤르도네\'를 추가하고 싶으시면, 궁합 노트에 한 줄 적는 일이고, 나머지 세 부분은 열어 볼 필요도 없습니다."',
    },
  },
};

const sampleReputation = {
  's1-wine-01': {
    level: '3년차 중상',
    summary:
      '요구사항의 빈틈을 스스로 찾아내 예시까지 들어 확인하는 습관이 자리 잡혀 있습니다. 다만 질문이 "계산 규칙"에는 향하고 "정책의 확장 가능성"에는 향하지 않아, 설계에 영향을 주는 모호함을 골라내는 감각은 아직 한 단계 남아 있습니다. 질문의 개수가 아니라 방향이 다음 성장 포인트입니다.',
    strengths: [
      '예산 초과 허용 여부를 두 차례 되물으면서 "예산 60,000원에 61,000원 와인은 후보인가요?"라는 경계값 예시를 직접 만들어 질문했습니다. 답을 받는 사람이 예/아니오로만 답해도 규칙이 확정되는, 비용이 낮고 정보량이 큰 질문 방식입니다.',
      '질문 후 답변을 기다리는 동안 해당 부분 구현을 뒤로 미루고 다른 책임 분리를 먼저 진행하는 등, 되묻기가 작업 중단으로 이어지지 않게 순서를 조정했습니다.',
    ],
    improvements: [
      '회원 등급(GOLD/VIP) 할인 정책은 "명절마다 바뀐다"고 명시된 확장 후보였는데, 새 등급이 생길 가능성을 확인하지 않고 현재 두 등급 기준으로 구조를 임의 확정했습니다. 질문을 많이 하는 것은 감점이 아니지만, 설계가 갈리는 지점의 모호함을 지나치는 것은 감점입니다.',
      '질문이 모두 계산 규칙(얼마, 몇 %)에 집중되어 있습니다. "이 규칙은 앞으로 누가, 얼마나 자주 바꾸나요?" 같은 변경 주체·빈도를 묻는 질문이 더해지면 구조 설계의 근거가 훨씬 단단해집니다.',
      '확인받은 내용(예산 초과 허용폭)을 코드 주석에만 남겼습니다. 합의된 규칙은 테스트 이름이나 상수 문서화로 남겨야 다음 사람에게 전달됩니다.',
    ],
  },
};

export default {
  missions,
  sampleReviews,
  sampleExplainFeedback,
  sampleReputation,
};
