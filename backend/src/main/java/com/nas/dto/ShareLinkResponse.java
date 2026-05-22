package com.nas.dto;

import com.nas.model.ShareLink;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareLinkResponse {

    private UUID id;
    private UUID fileId;
    private String fileName;
    private boolean isFolder;
    private String token;
    private boolean hasPassword;
    private String expiresAt;
    private int maxDownloads;
    private int downloadCount;
    private boolean isActive;
    private String createdAt;
    private String shareUrl;
    private String verifyToken;

    public static ShareLinkResponse fromEntity(ShareLink entity, String fileName, boolean isFolder) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        return ShareLinkResponse.builder()
                .id(entity.getId())
                .fileId(entity.getFileId())
                .fileName(fileName)
                .isFolder(isFolder)
                .token(entity.getToken())
                .hasPassword(entity.getPasswordHash() != null && !entity.getPasswordHash().isEmpty())
                .expiresAt(entity.getExpiresAt() != null ? entity.getExpiresAt().format(fmt) : null)
                .maxDownloads(entity.getMaxDownloads())
                .downloadCount(entity.getDownloadCount())
                .isActive(entity.isActive())
                .createdAt(entity.getCreatedAt().format(fmt))
                .shareUrl("/s/" + entity.getToken())
                .build();
    }
}
