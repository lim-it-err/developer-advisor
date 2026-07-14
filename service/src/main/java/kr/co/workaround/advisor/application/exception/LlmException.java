package kr.co.workaround.advisor.application.exception;

/** Thrown by LlmProvider implementations (claude/ollama) on network/parse failure. Maps to HTTP 502. */
public class LlmException extends RuntimeException {

    public LlmException(String message) {
        super(message);
    }

    public LlmException(String message, Throwable cause) {
        super(message, cause);
    }
}
