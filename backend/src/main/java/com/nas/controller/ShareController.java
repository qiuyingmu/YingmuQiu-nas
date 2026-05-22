package com.nas.controller;

import com.nas.dto.ApiResponse;
import com.nas.dto.ShareLinkRequest;
import com.nas.dto.ShareLinkResponse;
import com.nas.model.ShareLink;
import com.nas.repository.FileRepository;
import com.nas.repository.ShareLinkRepository;
import com.nas.service.ShareService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/shares")
public class ShareController {

    private final ShareService shareService;
    private final ShareLinkRepository shareLinkRepository;
    private final FileRepository fileRepository;

    public ShareController(ShareService shareService, ShareLinkRepository shareLinkRepository,
                           FileRepository fileRepository) {
        this.shareService = shareService;
        this.shareLinkRepository = shareLinkRepository;
        this.fileRepository = fileRepository;
    }

    // ---------- Create share link ----------

    @PostMapping
    public ResponseEntity<ApiResponse<ShareLinkResponse>> createShare(
            Authentication auth,
            @Valid @RequestBody ShareLinkRequest request) {

        UUID userId = UUID.fromString(auth.getName());

        if (request.getFileId() == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "请指定要分享的文件"));
        }

        ShareLinkResponse response = shareService.createShare(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("分享链接创建成功", response));
    }

    // ---------- Cancel share link ----------

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelShare(
            Authentication auth,
            @PathVariable String id) {

        UUID shareId;
        try {
            shareId = UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "无效的分享ID"));
        }

        UUID userId = UUID.fromString(auth.getName());
        shareService.cancelShare(userId, shareId);
        return ResponseEntity.ok(ApiResponse.success("分享已取消", null));
    }

    // ---------- My share list ----------

    @GetMapping
    public ResponseEntity<ApiResponse<List<ShareLinkResponse>>> getShares(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        List<ShareLinkResponse> shares = shareService.getUserShares(userId);
        return ResponseEntity.ok(ApiResponse.success(shares));
    }

    // ---------- Check file share status ----------

    @GetMapping("/{fileId}/status")
    public ResponseEntity<ApiResponse<?>> getShareStatus(
            Authentication auth,
            @PathVariable String fileId) {

        UUID fId;
        try {
            fId = UUID.fromString(fileId);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(ApiResponse.success("success", java.util.Map.of("shared", false)));
        }

        UUID userId = UUID.fromString(auth.getName());
        var shareLink = shareLinkRepository.findByFileIdAndUserIdAndIsActiveTrue(fId, userId);

        if (shareLink.isPresent()) {
            ShareLink link = shareLink.get();
            var file = fileRepository.findById(link.getFileId()).orElse(null);
            ShareLinkResponse response = ShareLinkResponse.fromEntity(
                    link,
                    file != null ? file.getName() : "(已删除)",
                    file != null && file.isFolder()
            );
            return ResponseEntity.ok(ApiResponse.success("success", response));
        }

        return ResponseEntity.ok(ApiResponse.success("success", java.util.Map.of("shared", false)));
    }
}
