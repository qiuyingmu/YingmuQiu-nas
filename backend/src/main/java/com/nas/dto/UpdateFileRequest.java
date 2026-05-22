package com.nas.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFileRequest {

    @Size(max = 255, message = "文件名称不能超过255个字符")
    private String name;

    private UUID parentId;
}
