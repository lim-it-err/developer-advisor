package kr.co.workaround.advisor.adapter.out.persistence.converter;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import kr.co.workaround.advisor.domain.mission.content.MissionContent;

@Converter
public class MissionContentConverter implements AttributeConverter<MissionContent, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .findAndRegisterModules();

    @Override
    public String convertToDatabaseColumn(MissionContent attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            return MAPPER.writeValueAsString(attribute);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize MissionContent", e);
        }
    }

    @Override
    public MissionContent convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            return MAPPER.readValue(dbData, MissionContent.class);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to deserialize MissionContent", e);
        }
    }
}
