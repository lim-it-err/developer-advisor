package kr.co.workaround.advisor.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.env.SystemEnvironmentPropertySource;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AdvisorCorsPropertiesTest {

    @Test
    void relaxedBindingReadsCommaSeparatedEnvironmentVariable() {
        StandardEnvironment environment = new StandardEnvironment();
        environment.getPropertySources().addFirst(new SystemEnvironmentPropertySource(
                "test-env",
                Map.of("ADVISOR_CORS_ALLOWED_ORIGINS", "https://one.example, https://two.example")
        ));

        AdvisorCorsProperties properties = Binder.get(environment)
                .bind("advisor.cors", Bindable.of(AdvisorCorsProperties.class))
                .orElseThrow(() -> new AssertionError("advisor.cors binding failed"));

        assertThat(properties.resolvedAllowedOrigins())
                .containsExactly("https://one.example", "https://two.example");
    }

    @Test
    void legacySingleOriginKeyRemainsSupported() {
        AdvisorCorsProperties properties = new AdvisorCorsProperties();
        properties.setAllowedOrigin("https://legacy.example");

        assertThat(properties.resolvedAllowedOrigins()).containsExactly("https://legacy.example");
    }
}
