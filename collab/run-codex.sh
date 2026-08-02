#!/bin/zsh
# Codex 10분 타이머 — collab/inbox의 질문에 답하게 한다.
# 용법:  ./collab/run-codex.sh          (포그라운드 루프, Ctrl+C로 종료)
#        ./collab/run-codex.sh once     (1회만 실행 — cron/launchd용)
set -u
cd "$(dirname "$0")/.."

PROMPT='collab/CODEX-BRIEF.md 파일을 지금 디스크에서 새로 읽어라(이전 실행의 기억 금지). 그 지침의 프로토콜대로 collab/inbox의 미답변 질문 1개를 처리하라. 질문이 참조하는 파일도 전부 새로 읽어라.'

run_once() {
  echo "[$(date '+%H:%M:%S')] codex 실행"
  codex exec --full-auto "$PROMPT"
  echo "[$(date '+%H:%M:%S')] 완료 — outbox 확인: ls collab/outbox/"
}

if [[ "${1:-}" == "once" ]]; then
  run_once
else
  while true; do
    run_once
    echo "다음 실행까지 10분 대기…"
    sleep 600
  done
fi
