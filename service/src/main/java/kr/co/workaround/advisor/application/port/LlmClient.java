package kr.co.workaround.advisor.application.port;

/**
 * The single port application services depend on to talk to an LLM. Structured output is
 * expressed as "give me back an instance of this Class" rather than a raw string — see
 * docs/EXERCISE-LLMCLIENT.md for the design rationale learners should reconstruct themselves.
 */
public interface LlmClient {

    <T> T complete(LlmRole role, String prompt, Class<T> type);
}
