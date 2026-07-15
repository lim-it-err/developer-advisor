#!/bin/zsh
# Developer Advisor 백엔드 시작 스크립트
# 용법:  ./run.sh test           — 전체 테스트
#        ./run.sh start [프로필]  — 서버 기동 (:8080). 프로필 생략 시 mock (API 키 불필요)
#                                   예) ./run.sh start claude  — 실제 Claude 호출 (ANTHROPIC_API_KEY 필요)
#        ./run.sh demo           — 떠 있는 서버에 트랙→미션→제출→리뷰 사이클 curl
set -e

# conda 등 셸 환경 오염 방어: JDK 21 고정 + 위험 변수 제거
export JAVA_HOME="$(/usr/libexec/java_home -v 21)"
unset JAVA_TOOL_OPTIONS CLASSPATH MAVEN_OPTS M2_HOME MAVEN_ARGS

cd "$(dirname "$0")"

case "${1:-start}" in
  test)
    mvn -q test
    echo "✅ 테스트 통과"
    ;;
  start)
    profile="${2:-mock}"
    if [[ "$profile" == "claude" && -z "$ANTHROPIC_API_KEY" ]]; then
      echo "❌ ANTHROPIC_API_KEY가 설정되어 있지 않습니다."
      echo "   export ANTHROPIC_API_KEY=... 후 다시 실행하세요."
      exit 1
    fi
    echo "▶ ${profile} 프로필로 기동합니다 (http://localhost:8080/api/advisor)"
    mvn -q spring-boot:run -Dspring-boot.run.profiles="$profile"
    ;;
  demo)
    base="http://localhost:8080/api/advisor"
    echo "① 트랙 생성"
    track=$(curl -sf -X POST "$base/tracks" -H 'Content-Type: application/json' \
      -d '{"domain":"와인","difficulty":"Easy","focus":"분리"}')
    echo "$track" | python3 -m json.tool
    tid=$(echo "$track" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')

    echo "② 미션 생성 (LLM: mock)"
    mission=$(curl -sf -X POST "$base/tracks/$tid/missions" -H 'Content-Type: application/json' -d '{}')
    mid=$(echo "$mission" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
    echo "$mission" | python3 -c 'import sys,json;m=json.load(sys.stdin);print(" ", m["id"], "|", m["title"])'

    echo "③ 코드 제출"
    sub=$(curl -sf -X POST "$base/missions/$mid/submissions" -H 'Content-Type: application/json' \
      -d '{"files":[{"path":"WineRecommender.java","content":"// 데모 제출"}],"explanation":"데모 설명"}')
    sid=$(echo "$sub" | python3 -c 'import sys,json;print(json.load(sys.stdin)["submissionId"])')
    echo "$sub" | python3 -m json.tool

    echo "④ 리뷰 조회 (점수/평판/시나리오/결말)"
    curl -sf "$base/submissions/$sid/review" | python3 -c 'import sys,json;r=json.load(sys.stdin);print("  overall:",r["overall"],"| ending:",r["ending"],"| reputation:",r["reputation"]["level"])'
    echo "✅ full cycle 성공"
    ;;
  *)
    echo "용법: ./run.sh [test|start [mock|claude]|demo]"
    exit 1
    ;;
esac
