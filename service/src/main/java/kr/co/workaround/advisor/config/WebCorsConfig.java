package kr.co.workaround.advisor.config;

import kr.co.workaround.advisor.adapter.in.web.AdvisorAuthInterceptor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableConfigurationProperties(AdvisorCorsProperties.class)
public class WebCorsConfig implements WebMvcConfigurer {

    private final AdvisorCorsProperties corsProperties;
    private final AdvisorAuthInterceptor advisorAuthInterceptor;

    public WebCorsConfig(AdvisorCorsProperties corsProperties, AdvisorAuthInterceptor advisorAuthInterceptor) {
        this.corsProperties = corsProperties;
        this.advisorAuthInterceptor = advisorAuthInterceptor;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(corsProperties.resolvedAllowedOrigins().toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(advisorAuthInterceptor)
                .addPathPatterns("/api/advisor/**");
    }
}
