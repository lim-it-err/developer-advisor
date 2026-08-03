# DEPLOY — 백엔드를 공개 서버에 올리는 절차

> 전제: dev-013 병합 완료. 프론트는 GitHub Pages 그대로, 백엔드만 클라우드에 올린다.
> 아래에서 `advisor-api.example.co.kr`는 보유 도메인의 서브도메인으로 바꿔 읽는다.

## 0. 준비물
- 서버 1대 (Lightsail 1GB 이상 권장 / EC2 t4g.micro), 우분투 계열
- 도메인 DNS 관리 권한
- Anthropic API 키 (서버에서만 환경변수로)

## 1. DNS
- A 레코드: `advisor-api` → 서버 공인 IP (Lightsail은 고정 IP 먼저 연결)

## 2. 서버 셋업 (한 번만)
```bash
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2 caddy git
sudo usermod -aG docker $USER   # 재로그인 필요
git clone https://github.com/lim-it-err/developer-advisor.git && cd developer-advisor
```

## 3. Caddy — HTTPS 자동
`/etc/caddy/Caddyfile`:
```
advisor-api.example.co.kr {
    reverse_proxy localhost:8080
}
```
```bash
sudo systemctl reload caddy
```
Caddy가 Let's Encrypt 인증서 발급·갱신을 전부 자동으로 한다. 방화벽/보안그룹에서 80·443만 연다 (8080은 열지 않는다 — Caddy 뒤에만 존재).

## 4. 백엔드 기동
```bash
export ANTHROPIC_API_KEY=sk-...
export ADVISOR_PROFILE=claude
export ADVISOR_AUTH_TOKEN=$(openssl rand -hex 24)   # 출력값을 따로 보관
export ADVISOR_CORS_ALLOWED_ORIGINS=https://lim-it-err.github.io
docker compose up -d --build
```
- 기록(H2)은 `./service/data/`에 남는다. 백업은 이 폴더 하나면 된다.
- 갱신 배포: `git pull && docker compose up -d --build`

## 5. 프론트 연결 (GitHub 저장소 설정, 한 번만)
- Settings → Secrets and variables → Actions → **Variables** → `ADVISOR_API_BASE` = `https://advisor-api.example.co.kr/api/advisor`
- main에 아무 커밋이나 푸시되면 Pages가 이 주소로 빌드된다.

## 6. 소유자 토큰 입력 (본인 브라우저에서 한 번)
- 사이트에서 닉네임 프롬프트의 "고급 — 엔진 토큰"에 4번의 `ADVISOR_AUTH_TOKEN` 값 입력.
- 이후 제출하면 실리뷰가 돌아온다. 토큰이 없는 방문자는 지금처럼 정직한 폴백을 본다.

## 7. 확인 체크리스트
```bash
curl -s https://advisor-api.example.co.kr/api/advisor/learners/ping/journal   # {} — TLS·서버 OK
curl -s -X POST https://advisor-api.example.co.kr/api/advisor/chat/preview -H 'Content-Type: application/json' -d '{"context":"t","history":[],"text":"hi"}'   # 401 — 가드 OK
```
사이트에서 카드 한 장 체크 → 서버 `./service/data/advisor.mv.db` 갱신 시각 확인 — 동기화 OK.

## 비용·안전 메모
- 과금 경로는 `ADVISOR_AUTH_TOKEN`을 아는 브라우저뿐이다. 토큰이 새면 서버에서 값만 바꿔 재기동하면 즉시 무효화된다.
- mock으로 먼저 올려 전 과정을 검증한 뒤 claude로 전환하는 순서를 권장한다 (`ADVISOR_PROFILE=mock`).
