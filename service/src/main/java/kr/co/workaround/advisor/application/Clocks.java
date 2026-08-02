package kr.co.workaround.advisor.application;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * 기록용 현재 시각. H2/JPA TIMESTAMP는 마이크로초 정밀도라, 나노초 해상도 플랫폼(리눅스)에서
 * Instant.now()를 그대로 저장하면 재조회 시 동등성이 깨진다. 저장 전 절단이 계약이다.
 */
public final class Clocks {

    private Clocks() {
    }

    public static Instant now() {
        return Instant.now().truncatedTo(ChronoUnit.MICROS);
    }
}
