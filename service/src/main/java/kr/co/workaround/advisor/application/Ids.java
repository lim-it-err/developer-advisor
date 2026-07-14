package kr.co.workaround.advisor.application;

import java.util.UUID;

/** Short prefixed id generator — trk_/msn_/sub_/rev_/chat_ + 12 hex chars. */
public final class Ids {

    private Ids() {
    }

    public static String next(String prefix) {
        return prefix + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }
}
