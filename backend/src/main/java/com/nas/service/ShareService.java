package com.nas.service;

import com.nas.config.StorageConfig;
import com.nas.dto.DownloadResult;
import com.nas.dto.ShareLinkRequest;
import com.nas.dto.ShareLinkResponse;
import com.nas.exception.BusinessException;
import com.nas.exception.ResourceNotFoundException;
import com.nas.model.FileEntity;
import com.nas.model.ShareLink;
import com.nas.repository.FileRepository;
import com.nas.repository.ShareLinkRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class ShareService {

    private static final Logger log = LoggerFactory.getLogger(ShareService.class);

    private final ShareLinkRepository shareLinkRepository;
    private final FileRepository fileRepository;
    private final PasswordEncoder passwordEncoder;
    private final StorageConfig storageConfig;

    // Track password-verified sessions: shareToken -> verifyToken -> timestamp
    // Entries auto-expire after 1 hour
    private static final long VERIFY_TOKEN_TTL_MS = 3600_000L;
    private final Map<String, Map<String, Long>> verifiedSessions = new ConcurrentHashMap<>();

    public ShareService(ShareLinkRepository shareLinkRepository,
                        FileRepository fileRepository,
                        PasswordEncoder passwordEncoder,
                        StorageConfig storageConfig) {
        this.shareLinkRepository = shareLinkRepository;
        this.fileRepository = fileRepository;
        this.passwordEncoder = passwordEncoder;
        this.storageConfig = storageConfig;
    }

    // ---------- Create Share ----------

    @Transactional
    public ShareLinkResponse createShare(UUID userId, ShareLinkRequest request) {
        // Verify file belongs to user
        FileEntity file = fileRepository.findByIdAndUserIdAndIsDeletedFalse(request.getFileId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("文件", request.getFileId()));

        // Check if already shared
        shareLinkRepository.findByFileIdAndUserIdAndIsActiveTrue(request.getFileId(), userId)
                .ifPresent(link -> {
                    throw new BusinessException("该文件已创建分享链接，请先取消现有分享");
                });

        // Build entity
        ShareLink.ShareLinkBuilder builder = ShareLink.builder()
                .fileId(request.getFileId())
                .userId(userId)
                .token(generateToken());

        // Optional password
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            builder.passwordHash(passwordEncoder.encode(request.getPassword()));
        }

        // Optional expiry
        if (request.getExpiresAt() != null && !request.getExpiresAt().isBlank()) {
            try {
                LocalDateTime expiresAt = LocalDateTime.parse(request.getExpiresAt(),
                        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                builder.expiresAt(expiresAt);
            } catch (DateTimeParseException e) {
                try {
                    LocalDateTime expiresAt = LocalDateTime.parse(request.getExpiresAt(),
                            DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                    builder.expiresAt(expiresAt);
                } catch (DateTimeParseException e2) {
                    throw new BusinessException("过期时间格式无效，请使用 yyyy-MM-dd HH:mm:ss 格式");
                }
            }
        }

        // Optional max downloads (0 = unlimited)
        if (request.getMaxDownloads() > 0) {
            builder.maxDownloads(request.getMaxDownloads());
        }

        ShareLink shareLink = shareLinkRepository.save(builder.build());
        return ShareLinkResponse.fromEntity(shareLink, file.getName(), file.isFolder());
    }

    // ---------- Cancel Share ----------

    @Transactional
    public void cancelShare(UUID userId, UUID shareId) {
        ShareLink link = shareLinkRepository.findById(shareId)
                .orElseThrow(() -> new ResourceNotFoundException("分享链接", shareId));

        if (!link.getUserId().equals(userId)) {
            throw new BusinessException("无权取消此分享");
        }

        link.setActive(false);
        shareLinkRepository.save(link);
    }

    // ---------- Get User Shares ----------

    public List<ShareLinkResponse> getUserShares(UUID userId) {
        List<ShareLink> links = shareLinkRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return links.stream().map(link -> {
            FileEntity file = fileRepository.findById(link.getFileId()).orElse(null);
            String fileName = file != null ? file.getName() : "(已删除)";
            return ShareLinkResponse.fromEntity(link, fileName, file != null && file.isFolder());
        }).collect(Collectors.toList());
    }

    // ---------- Get Share By Token (public) ----------

    public ShareLinkResponse getShareByToken(String token) {
        ShareLink link = findValidShare(token);
        FileEntity file = fileRepository.findById(link.getFileId())
                .orElseThrow(() -> new BusinessException("分享的文件已被删除"));

        return ShareLinkResponse.fromEntity(link, file.getName(), file.isFolder());
    }

    // ---------- Verify Password (public) ----------

    public ShareLinkResponse verifyPassword(String token, String password) {
        ShareLink link = findValidShare(token);

        if (link.getPasswordHash() == null || link.getPasswordHash().isEmpty()) {
            throw new BusinessException("该分享无需密码");
        }

        if (!passwordEncoder.matches(password, link.getPasswordHash())) {
            throw new BusinessException("密码错误");
        }

        // Generate temporary verification token (1 hour TTL)
        String verifyToken = UUID.randomUUID().toString().replace("-", "");
        verifiedSessions.computeIfAbsent(token, k -> new ConcurrentHashMap<>())
                .put(verifyToken, System.currentTimeMillis() + VERIFY_TOKEN_TTL_MS);

        FileEntity file = fileRepository.findById(link.getFileId())
                .orElseThrow(() -> new BusinessException("分享的文件已被删除"));

        ShareLinkResponse response = ShareLinkResponse.fromEntity(link, file.getName(), file.isFolder());
        response.setVerifyToken(verifyToken);
        return response;
    }

    // ---------- Download via Share (public) ----------

    @Transactional
    public DownloadResult getShareDownload(String token, String verifyToken, String rangeHeader) {
        ShareLink link = findValidShare(token);

        // Verify password if needed
        if (link.getPasswordHash() != null && !link.getPasswordHash().isEmpty()) {
            if (verifyToken == null || verifyToken.isBlank()) {
                throw new BusinessException("需要密码验证");
            }
            Map<String, Long> tokens = verifiedSessions.get(token);
            if (tokens == null) {
                throw new BusinessException("密码验证已过期或无效，请重新验证");
            }
            Long expiry = tokens.get(verifyToken);
            if (expiry == null || System.currentTimeMillis() > expiry) {
                tokens.remove(verifyToken);
                if (tokens.isEmpty()) verifiedSessions.remove(token);
                throw new BusinessException("密码验证已过期或无效，请重新验证");
            }
        }

        // Check if file exists
        FileEntity file = fileRepository.findById(link.getFileId())
                .orElseThrow(() -> new BusinessException("分享的文件已被删除"));

        if (file.isFolder()) {
            throw new BusinessException("无法下载文件夹");
        }

        Path filePath = storageConfig.resolveRelativePath(file.getStoragePath());
        if (!Files.exists(filePath)) {
            throw new ResourceNotFoundException("文件存储丢失: " + file.getName());
        }

        // Increment download count
        link.setDownloadCount(link.getDownloadCount() + 1);
        shareLinkRepository.save(link);

        // Check if max downloads reached (after increment)
        if (link.getMaxDownloads() > 0 && link.getDownloadCount() >= link.getMaxDownloads()) {
            link.setActive(false);
            shareLinkRepository.save(link);
        }

        // Build download result (same logic as FileService.getDownloadResource)
        long fileLength = file.getSizeBytes();
        long start = 0;
        long end = fileLength - 1;
        String contentType = file.getMimeType() != null ? file.getMimeType() : "application/octet-stream";
        String contentDisposition = "attachment; filename*=UTF-8''" + URLEncoder.encode(file.getName(), StandardCharsets.UTF_8);

        boolean isPartial = false;

        if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
            try {
                String range = rangeHeader.substring("bytes=".length()).trim();
                int dashIndex = range.indexOf('-');
                if (dashIndex > 0) {
                    start = Long.parseLong(range.substring(0, dashIndex));
                }
                if (dashIndex < range.length() - 1) {
                    end = Long.parseLong(range.substring(dashIndex + 1));
                }
                if (start > end || start >= fileLength) {
                    throw new BusinessException("Range 范围无效");
                }
                isPartial = true;
            } catch (NumberFormatException e) {
                // Invalid range, serve full file
            }
        }

        long contentLength = end - start + 1;
        Resource resource = new FileSystemResource(filePath.toFile());

        return new DownloadResult(resource, contentType, contentDisposition, contentLength,
                start, end, fileLength, isPartial);
    }

    // ---------- Helpers ----------

    private ShareLink findValidShare(String token) {
        ShareLink link = shareLinkRepository.findByTokenAndIsActiveTrue(token)
                .orElseThrow(() -> new BusinessException("分享链接无效或已失效"));

        // Check expiry
        if (link.getExpiresAt() != null && LocalDateTime.now().isAfter(link.getExpiresAt())) {
            link.setActive(false);
            shareLinkRepository.save(link);
            throw new BusinessException("分享链接已过期");
        }

        // Check download limit
        if (link.getMaxDownloads() > 0 && link.getDownloadCount() >= link.getMaxDownloads()) {
            link.setActive(false);
            shareLinkRepository.save(link);
            throw new BusinessException("分享链接下载次数已用完");
        }

        return link;
    }

    private String generateToken() {
        String raw = UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
        return raw.substring(0, 32);
    }
}
