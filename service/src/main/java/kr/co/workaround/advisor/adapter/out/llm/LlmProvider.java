package kr.co.workaround.advisor.adapter.out.llm;

/** Internal SPI (not the application port) — one implementation per backend: mock/claude/ollama. */
public interface LlmProvider {

    String name();

    <T> T complete(String model, String prompt, Class<T> type);
}
