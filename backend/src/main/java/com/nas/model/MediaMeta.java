package com.nas.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "media_meta")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaMeta {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "file_id", unique = true, nullable = false)
    private UUID fileId;

    @Column(name = "media_type", nullable = false, length = 16)
    private String mediaType;

    private Integer width;

    private Integer height;

    @Column(name = "duration_ms")
    private Long durationMs;

    private String codec;

    @Column(columnDefinition = "TEXT")
    private String exifData;

    @Column(name = "gps_lat")
    private Double gpsLat;

    @Column(name = "gps_lng")
    private Double gpsLng;

    @Column(name = "taken_at")
    private LocalDateTime takenAt;

    @Column(name = "has_thumbnail", nullable = false)
    @Builder.Default
    private boolean hasThumbnail = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
