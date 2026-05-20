package com.nas.dto;

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
public class MediaResponse {

    private UUID id;
    private UUID fileId;
    private String fileName;
    private String mediaType;
    private Long fileSize;
    private String mimeType;
    private Integer width;
    private Integer height;
    private Long durationMs;
    private Double gpsLat;
    private Double gpsLng;
    private LocalDateTime takenAt;
    private LocalDateTime createdAt;
    private boolean hasThumbnail;
}
