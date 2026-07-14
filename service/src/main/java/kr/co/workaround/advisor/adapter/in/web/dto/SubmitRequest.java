package kr.co.workaround.advisor.adapter.in.web.dto;

import java.util.List;

public record SubmitRequest(List<FileDto> files, String explanation) {
}
