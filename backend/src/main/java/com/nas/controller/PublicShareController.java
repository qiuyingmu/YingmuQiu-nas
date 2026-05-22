package com.nas.controller;

import com.nas.dto.ApiResponse;
import com.nas.dto.DownloadResult;
import com.nas.dto.ShareLinkResponse;
import com.nas.service.ShareService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/s")
public class PublicShareController {

    private final ShareService shareService;

    public PublicShareController(ShareService shareService) {
        this.shareService = shareService;
    }

    // ---------- Get share info ----------

    @GetMapping("/{token}")
    public ResponseEntity<ApiResponse<ShareLinkResponse>> getShareInfo(@PathVariable String token) {
        ShareLinkResponse response = shareService.getShareByToken(token);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ---------- Verify password ----------

    @PostMapping("/{token}/verify")
    public ResponseEntity<ApiResponse<ShareLinkResponse>> verifyPassword(
            @PathVariable String token,
            @RequestBody Map<String, String> body) {

        String password = body.get("password");
        if (password == null || password.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "请输入密码"));
        }

        ShareLinkResponse response = shareService.verifyPassword(token, password);
        return ResponseEntity.ok(ApiResponse.success("密码验证成功", response));
    }

    // ---------- Download shared file ----------

    @GetMapping("/{token}/download")
    public ResponseEntity<Resource> downloadShare(
            @PathVariable String token,
            @RequestParam(value = "verifyToken", required = false) String verifyToken,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader) {

        DownloadResult result = shareService.getShareDownload(token, verifyToken, rangeHeader);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(result.getContentType()));
        headers.set(HttpHeaders.CONTENT_DISPOSITION, result.getContentDisposition());
        headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");

        if (result.isPartial()) {
            headers.set(HttpHeaders.CONTENT_RANGE,
                    "bytes " + result.getStart() + "-" + result.getEnd() + "/" + result.getFileLength());
            headers.setContentLength(result.getContentLength());
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .headers(headers)
                    .body(result.getResource());
        }

        headers.setContentLength(result.getContentLength());
        return ResponseEntity.ok()
                .headers(headers)
                .body(result.getResource());
    }
}
