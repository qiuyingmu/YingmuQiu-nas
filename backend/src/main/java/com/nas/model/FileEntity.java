package com.nas.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "file_entities", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "parent_id", "name",
            "is_deleted"})
}, indexes = {
    @Index(name = "idx_file_user_name", columnList = "user_id, name"),
    @Index(name = "idx_file_parent", columnList = "parent_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(nullable = false)
    private String name;

    @Column(name = "is_folder", nullable = false)
    private boolean isFolder;

    @Column(name = "mime_type")
    private String mimeType;

    @Builder.Default
    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes = 0L;

    @Column(name = "storage_path")
    private String storagePath;

    @Column(name = "file_hash")
    private String fileHash;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
