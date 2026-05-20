package com.nas.dto;

import com.nas.model.FileEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileResponse {

    private UUID id;
    private UUID userId;
    private UUID parentId;
    private String name;
    private boolean isFolder;
    private String mimeType;
    private Long sizeBytes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static FileResponse fromEntity(FileEntity entity) {
        return FileResponse.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .parentId(entity.getParentId())
                .name(entity.getName())
                .isFolder(entity.isFolder())
                .mimeType(entity.getMimeType())
                .sizeBytes(entity.getSizeBytes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
