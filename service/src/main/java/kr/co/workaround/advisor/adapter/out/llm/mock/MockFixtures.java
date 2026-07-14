package kr.co.workaround.advisor.adapter.out.llm.mock;

import kr.co.workaround.advisor.adapter.out.llm.ChatReply;
import kr.co.workaround.advisor.domain.mission.content.Briefing;
import kr.co.workaround.advisor.domain.mission.content.Ending;
import kr.co.workaround.advisor.domain.mission.content.ExplainTask;
import kr.co.workaround.advisor.domain.mission.content.HiddenCase;
import kr.co.workaround.advisor.domain.mission.content.MissionContent;
import kr.co.workaround.advisor.domain.mission.content.RubricItem;
import kr.co.workaround.advisor.domain.mission.content.SourceFile;
import kr.co.workaround.advisor.domain.review.content.EndingStamp;
import kr.co.workaround.advisor.domain.review.content.ExplainDetail;
import kr.co.workaround.advisor.domain.review.content.ExplainFeedback;
import kr.co.workaround.advisor.domain.review.content.Reputation;
import kr.co.workaround.advisor.domain.review.content.ReviewContent;
import kr.co.workaround.advisor.domain.review.content.ReviewItem;
import kr.co.workaround.advisor.domain.review.content.ReviewedHiddenCase;

import java.util.List;

/**
 * Fixed wine-domain fixtures for the mock LLM provider. Keys/network = 0.
 * Mirrors the shape of frontend/src/modules/missions/data/sampleContent.js so the
 * mock backend and the frontend prototype tell the same story end to end.
 */
public final class MockFixtures {

    private MockFixtures() {
    }

    public static MissionContent missionContent() {
        return new MissionContent(
                new Briefing("분리의 감각",
                        "### 상황\n사내 복지몰에 붙어 있는 와인 추천 기능을 물려받았습니다. 퇴사한 선임이 혼자 만든 코드인데, "
                                + "명절 선물 시즌마다 규칙 수정 요청이 쏟아져서 매번 전체 코드를 다시 읽어야 하는 상황입니다."),
                "사내 복지몰에 붙어 있는 와인 추천 기능을 물려받았습니다. 운영팀은 \"와인 목록도 곧 DB로 옮길 것\"이라고 예고했습니다. "
                        + "동작은 그대로 유지하면서, 다음 요청이 와도 겁나지 않는 구조로 정리해 주세요.",
                List.of(new SourceFile("src/main/java/kr/co/wine/WineRecommender.java",
                        "package kr.co.wine;\n\npublic class WineRecommender {\n"
                                + "    // 병렬 배열로 관리되는 와인 목록 — 리팩토링 대상\n"
                                + "    String[] names;\n    int[] bodies;\n    int[] sweetness;\n    int[] prices;\n"
                                + "\n    public String recommend(String grade, int budget, String food) {\n"
                                + "        // ... 책임이 뒤엉킨 추천/할인/페어링 로직\n        return null;\n    }\n}\n")),
                List.of(),
                List.of("병렬 배열을 유지한 채로도 동작이 바뀌지 않아야 합니다.",
                        "GOLD/VIP 등급별 할인 로직을 명확히 분리하세요.",
                        "음식 페어링 규칙은 향후 명절마다 바뀝니다 — 이 변경이 다른 코드에 번지지 않게 하세요."),
                List.of("예산 초과 허용 범위는 명확히 협의된 문서가 없습니다.",
                        "기존 API 시그니처(recommend(String,int,String))는 유지해야 합니다."),
                List.of("책임 분리(SRP)", "인터페이스를 통한 의존성 역전", "변경 지점을 예측해 확장 포인트를 설계하는 감각"),
                List.of("페어링 규칙만 따로 클래스로 뽑아보면 어떨까요?", "할인 정책도 하나의 인터페이스로 다뤄질 수 있을까요?"),
                List.of(
                        new RubricItem("책임 분리", "추천/할인/페어링 로직이 각자의 클래스로 분리되었는가", 30, true),
                        new RubricItem("인터페이스 설계", "페어링 규칙이 교체 가능한 인터페이스로 추상화되었는가", 25, true),
                        new RubricItem("회귀 방지", "기존 동작(가격/등급 계산)이 그대로 보존되었는가", 20, true),
                        new RubricItem("확장성", "새 등급/새 음식이 추가돼도 기존 코드가 흔들리지 않는가", 15, false),
                        new RubricItem("가독성", "메서드/클래스 이름이 의도를 드러내는가", 10, false)
                ),
                List.of(
                        new HiddenCase("예산 0원 손님", "예산이 0 이하로 들어오는 입력을 어떻게 처리하는지 확인합니다."),
                        new HiddenCase("G0LD 회원의 침묵", "등급 문자열에 오타가 섞였을 때 조용히 무할인 처리되지 않는지 확인합니다."),
                        new HiddenCase("메뉴에 없는 음식", "지원하지 않는 음식이 들어왔을 때 결과가 왜곡되지 않는지 확인합니다.")
                ),
                List.of(
                        new Ending("calm", "고요한 배포", "아무 일도 일어나지 않는 평온한 사후담"),
                        new Ending("hotfix", "명절마다 열리는 파일", "다음 요청이 왔을 때 두 줄만 고치고 끝나는 이야기"),
                        new Ending("dawn", "새벽의 장애", "숨은 케이스가 실서비스에서 터지는 이야기"),
                        new Ending("hidden", "???", "아직 드러나지 않은 결말")
                ),
                new ExplainTask("소믈리에 출신 기획자", "새로 만든 추천 시스템 구조를 비개발자에게 비유로 설명해 보세요."),
                null
        );
    }

    public static ReviewContent reviewContent() {
        return new ReviewContent(
                "책임을 나누려는 방향은 정확했습니다. PairingRule을 인터페이스로 분리한 점은 이번 미션의 핵심을 정확히 짚었습니다. "
                        + "다만 등급 문자열 비교와 default 분기의 무음 통과는 실서비스라면 CS팀이 먼저 발견했을 문제입니다.",
                List.of(
                        new ReviewItem("책임 분리", 24, "class PairingRule { ... }", "추천/페어링 책임을 분리한 시도는 좋았습니다."),
                        new ReviewItem("인터페이스 설계", 20, "interface PairingRule { int score(Wine w, String food); }",
                                "인터페이스로 교체 가능한 구조를 만든 점을 높이 평가합니다."),
                        new ReviewItem("회귀 방지", 15, "// 예산 초과 허용은 기존과 동일하게 1만원으로 유지",
                                "기존 계산 규칙이 유지된 것은 확인됩니다."),
                        new ReviewItem("확장성", 7, "grade.equals(\"GOLD\")", "등급 비교가 문자열로 남아 있어 확장에 취약합니다.")
                ),
                List.of(
                        new ReviewedHiddenCase("예산 0원 손님", true,
                                "파싱 직후 예산이 0 이하이면 예외를 던지는 검증이 있어 통과했습니다.", null),
                        new ReviewedHiddenCase("G0LD 회원의 침묵", false,
                                "grade.equals(\"GOLD\") 문자열 비교가 그대로 남아 \"G0LD\"는 에러 없이 무할인 처리됐습니다.",
                                "실서비스에서도 쿠폰·등급 코드 오타가 소리 없이 무할인으로 흘러, 개발팀보다 CS팀이 먼저 장애를 발견하는 사례가 반복됩니다."),
                        new ReviewedHiddenCase("메뉴에 없는 음식", false,
                                "switch의 default가 여전히 무음 통과라 지원하지 않는 음식은 페어링 0점인 채 왜곡된 추천이 나갑니다.", null)
                ),
                List.of(
                        "Wine을 record로 도입하고 병렬 배열을 List<Wine>으로 교체해 보세요.",
                        "할인 로직을 DiscountPolicy로 분리해 보세요.",
                        "경계값 케이스를 JUnit 테스트로 고정한 뒤 다시 구조를 바꿔 보세요."
                ),
                List.of(
                        "와인 데이터가 DB로 옮겨진다면, 지금 구조에서 정확히 어떤 클래스가 바뀌나요?",
                        "PairingRule을 분리하셨는데, 상품 단위 페어링 예외가 생기면 어디가 부러질까요?"
                ),
                "**배포 +3일.** 아무 일도 일어나지 않는다. 모니터링 그래프는 평평하다.\n\n"
                        + "**배포 +11일.** 총무팀 김 과장이 \"G0LD\"를 입력한다. 시스템은 에러 없이 정가를 안내한다.\n\n"
                        + "**배포 +34일.** 운영팀 메일이 도착한다. \"떡국이랑 갈비찜 페어링 추가해 주세요.\" 당신은 PairingRule을 열고 두 줄을 넣는다.",
                new EndingStamp("hotfix", "명절마다 열리는 파일"),
                new Reputation("3년차 중상",
                        "요구사항의 빈틈을 스스로 찾아내는 습관이 자리 잡혀 있습니다. 다만 설계에 영향을 주는 모호함을 골라내는 감각은 한 단계 남아 있습니다.",
                        List.of("예산 초과 허용 여부를 경계값 예시까지 들어 확인했습니다.",
                                "질문 후 답변을 기다리는 동안 다른 작업을 먼저 진행했습니다."),
                        List.of("회원 등급 확장 가능성을 확인하지 않고 구조를 임의 확정했습니다.",
                                "질문이 계산 규칙에만 집중되어 변경 주체·빈도를 묻지 않았습니다.")
                ),
                null,
                null
        );
    }

    public static ExplainFeedback explainFeedback() {
        return new ExplainFeedback(
                "제가 만든 추천 시스템은 소믈리에님이 손님 응대하시는 거랑 비슷하게 나눠져 있어요.",
                new ExplainDetail(
                        "도입-구성요소 나열-결론의 뼈대는 갖췄지만, 청자의 관심사(규칙 변경)가 늦게 등장합니다.",
                        "\"인터페이스\"라는 용어를 풀지 않고 지나간 비약이 있습니다.",
                        "비유를 선언만 하고 실제 매핑을 짝지어 주지 않았습니다.",
                        "\"기획자님이 제일 자주 하실 일이 명절 페어링 규칙 바꾸기라고 들었어요. 결론부터 말씀드리면...\""
                )
        );
    }

    public static ChatReply chatReply() {
        return new ChatReply(
                "좋은 지점을 짚으셨어요. 예산 초과는 협의된 문서가 없으니, 기존 코드 기준(1만원)을 유지하되 "
                        + "정책 확정이 필요하다는 걸 질문 목록에 남겨두는 걸 추천해요."
        );
    }
}
