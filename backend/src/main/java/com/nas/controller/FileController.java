package com.nas.controller;

import com.nas.dto.ApiResponse;
import com.nas.dto.FileResponse;
import com.nas.service.FileService;
import com.nas.service.FileService.DownloadResult;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    // ---------- List directory contents ----------

    @GetMapping
    public ResponseEntity<ApiResponse<?>> listFiles(
            Authentication auth,
            @RequestParam(required = false) UUID parentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int pageSize,
            @RequestParam(defaultValue = "name,asc") String sort) {

        UUID userId = UUID.fromString(auth.getName());

        if (pageSize <= 0) {
            // Return all without pagination
            List<FileResponse> files = fileService.listFiles(userId, parentId);
            return ResponseEntity.ok(ApiResponse.success(files));
        }

        String[] sortParts = sort.split(",");
        String sortField = sortParts.length > 0 ? sortParts[0] : "name";
        Sort.Direction sortDir = sortParts.length > 1 && "desc".equalsIgnoreCase(sortParts[1])
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(sortDir, sortField));

        Page<FileResponse> filePage = fileService.listFilesPaged(userId, parentId, pageable);
        return ResponseEntity.ok(ApiResponse.success(filePage));
    }

    // ---------- File tree ----------

    @GetMapping("/tree")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTree(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        List<Map<String, Object>> tree = fileService.getFileTree(userId);
        return ResponseEntity.ok(ApiResponse.success(tree));
    }

    // ---------- Create folder ----------

    @PostMapping("/folder")
    public ResponseEntity<ApiResponse<FileResponse>> createFolder(
            Authentication auth,
            @RequestBody Map<String, Object> body) {

        UUID userId = UUID.fromString(auth.getName());
        String name = (String) body.get("name");
        UUID parentId = body.get("parentId") != null
                ? UUID.fromString((String) body.get("parentId"))
                : null;

        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "文件夹名称不能为空"));
        }

        FileResponse folder = fileService.createFolder(userId, name, parentId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("创建成功", folder));
    }

    // ---------- Rename/Move ----------

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FileResponse>> updateFile(
            Authentication auth,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {

        UUID userId = UUID.fromString(auth.getName());
        String name = (String) body.get("name");
        UUID parentId = body.get("parentId") != null
                ? UUID.fromString((String) body.get("parentId"))
                : null;

        FileResponse updated = fileService.updateFile(userId, id, name, parentId);
        return ResponseEntity.ok(ApiResponse.success("更新成功", updated));
    }

    // ---------- Batch delete (move to trash) ----------

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteFiles(
            Authentication auth,
            @RequestBody Map<String, List<UUID>> body) {

        UUID userId = UUID.fromString(auth.getName());
        List<UUID> ids = body.get("ids");
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "请指定要删除的文件ID"));
        }

        fileService.deleteFiles(userId, ids);
        return ResponseEntity.ok(ApiResponse.success("已移入回收站", null));
    }

    // ---------- Trash list ----------

    @GetMapping("/trash")
    public ResponseEntity<ApiResponse<List<FileResponse>>> getTrash(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        List<FileResponse> trash = fileService.getTrash(userId);
        return ResponseEntity.ok(ApiResponse.success(trash));
    }

    // ---------- Restore from trash ----------

    @PostMapping("/trash/restore")
    public ResponseEntity<ApiResponse<Void>> restoreFiles(
            Authentication auth,
            @RequestBody Map<String, List<UUID>> body) {

        UUID userId = UUID.fromString(auth.getName());
        List<UUID> ids = body.get("ids");
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "请指定要恢复的文件ID"));
        }

        fileService.restoreFiles(userId, ids);
        return ResponseEntity.ok(ApiResponse.success("恢复成功", null));
    }

    // ---------- Empty trash ----------

    @DeleteMapping("/trash/empty")
    public ResponseEntity<ApiResponse<Void>> emptyTrash(
            Authentication auth,
            @RequestBody Map<String, List<UUID>> body) {

        UUID userId = UUID.fromString(auth.getName());
        List<UUID> ids = body.get("ids");
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "请指定要永久删除的文件ID"));
        }

        fileService.emptyTrash(userId, ids);
        return ResponseEntity.ok(ApiResponse.success("已永久删除", null));
    }

    private static final Set<String> BLOCKED_EXTENSIONS = Set.of(
            "exe", "sh", "bat", "cmd", "dll", "msi", "vbs", "ps1", "jar");

    // ---------- Upload ----------

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<FileResponse>> uploadFile(
            Authentication auth,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) UUID parentId) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "上传文件不能为空"));
        }

        // 检查文件扩展名
        String originalName = file.getOriginalFilename();
        if (originalName != null) {
            String ext = originalName.toLowerCase();
            int dot = ext.lastIndexOf('.');
            if (dot >= 0) {
                ext = ext.substring(dot + 1);
                if (BLOCKED_EXTENSIONS.contains(ext)) {
                    return ResponseEntity.badRequest()
                            .body(ApiResponse.error(400, "不支持上传此文件类型: ." + ext));
                }
            }
        }

        UUID userId = UUID.fromString(auth.getName());
        FileResponse response = fileService.uploadFile(userId, file, parentId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("上传成功", response));
    }

    // ---------- Download (with Range header support) ----------

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadFile(
            Authentication auth,
            @PathVariable UUID id,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader) {

        UUID userId = UUID.fromString(auth.getName());
        DownloadResult result = fileService.getDownloadResource(userId, id, rangeHeader);

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

    // ---------- Search ----------

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<FileResponse>>> searchFiles(
            Authentication auth,
            @RequestParam("q") String keyword) {

        UUID userId = UUID.fromString(auth.getName());
        List<FileResponse> results = fileService.searchFiles(userId, keyword);
        return ResponseEntity.ok(ApiResponse.success(results));
    }
}
