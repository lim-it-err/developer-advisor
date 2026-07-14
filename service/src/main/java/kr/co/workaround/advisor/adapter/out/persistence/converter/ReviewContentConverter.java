package kr.co.workaround.advisor.adapter.out.persistence.converter;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import kr.co.workaround.advisor.domain.review.content.ReviewContent;

@Converter
public class ReviewContentConverter implements AttributeConverter<ReviewContent, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .findAndRegisterModules();

    @Override
    public String convertToDatabaseColumn(ReviewContent attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            return MAPPER.writeValueAsString(attribute);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize ReviewContent", e);
        }
    }

    @Override
    public ReviewContent convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            return MAPPER.readValue(dbData, ReviewContent.class);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to deserialize ReviewContent", e);
        }
    }
}
