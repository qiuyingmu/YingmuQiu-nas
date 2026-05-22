package com.nas.service;

import com.nas.config.StorageConfig;
import com.nas.dto.DownloadResult;
import com.nas.dto.FileResponse;
import com.nas.exception.BusinessException;
import com.nas.exception.ResourceNotFoundException;
import com.nas.model.FileEntity;
import com.nas.model.User;
import com.nas.repository.FileRepository;
import com.nas.repository.UserRepository;
import com.nas.websocket.FileChangeHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FileService {

    private static final Logger log = LoggerFactory.getLogger(FileService.class);

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final StorageConfig storageConfig;
    private final MediaService mediaService;
    private final FileChangeHandler fileChangeHandler;

    public FileService(FileRepository fileRepository,
                       UserRepository userRepository,
                       StorageConfig storageConfig,
                       MediaService mediaService,
                       FileChangeHandler fileChangeHandler) {
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.storageConfig = storageConfig;
        this.mediaService = mediaService;
        this.fileChangeHandler = fileChangeHandler;
    }

    // ---------- List ----------

    public List<FileResponse> listFiles(UUID userId, UUID parentId) {
        List<FileEntity> files;
        if (parentId == null) {
            files = fileRepository.findRootByUserId(userId);
        } else {
            files = fileRepository.findByUserIdAndParentIdAndIsDeletedFalse(userId, parentId);
        }
        return files.stream()
                .map(FileResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public Page<FileResponse> listFilesPaged(UUID userId, UUID parentId, Pageable pageable) {
        Page<FileEntity> page;
        if (parentId == null) {
            page = fileRepository.findByUserIdAndParentIdAndIsDeletedFalse(
                    userId, null, pageable);
        } else {
            page = fileRepository.findByUserIdAndParentIdAndIsDeletedFalse(
                    userId, parentId, pageable);
        }
        return page.map(FileResponse::fromEntity);
    }

    // ---------- Tree ----------

    public List<Map<String, Object>> getFileTree(UUID userId) {
        List<FileEntity> allFolders = fileRepository.findAllFoldersByUserId(userId);
        Map<UUID, List<Map<String, Object>>> childrenMap = new HashMap<>();

        for (FileEntity folder : allFolders) {
            Map<String, Object> node = new HashMap<>();
            node.put("id", folder.getId());
            node.put("name", folder.getName());
            node.put("parentId", folder.getParentId());
            node.put("isFolder", true);
            childrenMap.computeIfAbsent(folder.getParentId(), k -> new ArrayList<>()).add(node);
        }

        List<Map<String, Object>> roots = childrenMap.getOrDefault(null, new ArrayList<>());
        buildTree(roots, childrenMap);
        return roots;
    }

    private void buildTree(List<Map<String, Object>> nodes,
                           Map<UUID, List<Map<String, Object>>> childrenMap) {
        for (Map<String, Object> node : nodes) {
            UUID id = (UUID) node.get("id");
            List<Map<String, Object>> children = childrenMap.getOrDefault(id, new ArrayList<>());
            if (!children.isEmpty()) {
                buildTree(children, childrenMap);
                node.put("children", children);
            }
        }
    }

    // ---------- Create Folder ----------

    @Transactional
    public FileResponse createFolder(UUID userId, String name, UUID parentId) {
        // Check duplicate name
        checkDuplicateName(userId, parentId, name);

        // If parentId provided, verify parent exists
        if (parentId != null) {
            fileRepository.findByIdAndUserIdAndIsDeletedFalse(parentId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("父文件夹", parentId));
        }

        FileEntity folder = FileEntity.builder()
                .userId(userId)
                .parentId(parentId)
                .name(name)
                .isFolder(true)
                .build();

        return FileResponse.fromEntity(fileRepository.save(folder));
    }

    // ---------- Rename/Move ----------

    @Transactional
    public FileResponse updateFile(UUID userId, UUID fileId, String name, UUID parentId) {
        FileEntity file = fileRepository.findByIdAndUserIdAndIsDeletedFalse(fileId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("文件", fileId));

        // 防止将文件夹移入自身或子文件夹（循环引用）
        if (parentId != null && file.isFolder()) {
            UUID currentId = parentId;
            while (currentId != null) {
                if (currentId.equals(fileId)) {
                    throw new BusinessException("不能将文件夹移入自身或子文件夹");
                }
                FileEntity parent = fileRepository.findByIdAndUserIdAndIsDeletedFalse(currentId, userId)
                        .orElse(null);
                currentId = parent != null ? parent.getParentId() : null;
            }
        }

        if (name != null && !name.equals(file.getName())) {
            UUID targetParentId = parentId != null ? parentId : file.getParentId();
            checkDuplicateName(userId, targetParentId, name);
            file.setName(name);
        }

        if (parentId != null && !parentId.equals(file.getParentId())) {
            // Verify new parent exists
            fileRepository.findByIdAndUserIdAndIsDeletedFalse(parentId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("父文件夹", parentId));
            checkDuplicateName(userId, parentId, file.getName());
            file.setParentId(parentId);
        }

        FileResponse response = FileResponse.fromEntity(fileRepository.save(file));
        fileChangeHandler.notifyFileChange(userId, "update", fileId);
        return response;
    }

    // ---------- Delete (move to trash) ----------

    @Transactional
    public void deleteFiles(UUID userId, List<UUID> ids) {
        for (UUID id : ids) {
            FileEntity file = fileRepository.findByIdAndUserIdAndIsDeletedFalse(id, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("文件", id));
            softDelete(file);
            fileChangeHandler.notifyFileChange(userId, "delete", id);
        }
    }

    private void softDelete(FileEntity file) {
        file.setDeleted(true);
        file.setDeletedAt(LocalDateTime.now());
        fileRepository.save(file);

        // Cascade delete children (user-isolated)
        if (file.isFolder()) {
            List<FileEntity> children = fileRepository.findByParentIdAndUserIdAndIsDeletedFalse(
                    file.getId(), file.getUserId());
            for (FileEntity child : children) {
                softDelete(child);
            }
        }
    }

    // ---------- Trash ----------

    public List<FileResponse> getTrash(UUID userId) {
        return fileRepository.findByUserIdAndIsDeletedTrue(userId).stream()
                .map(FileResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void restoreFiles(UUID userId, List<UUID> ids) {
        for (UUID id : ids) {
            FileEntity file = fileRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("文件", id));

            if (!file.getUserId().equals(userId)) {
                throw new BusinessException("无权操作此文件");
            }

            file.setDeleted(false);
            file.setDeletedAt(null);
            fileRepository.save(file);
            fileChangeHandler.notifyFileChange(userId, "restore", id);
        }
    }

    @Transactional
    public void emptyTrash(UUID userId, List<UUID> ids) {
        for (UUID id : ids) {
            FileEntity file = fileRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("文件", id));

            if (!file.getUserId().equals(userId)) {
                throw new BusinessException("无权操作此文件");
            }

            // Delete physical file if not a folder
            if (!file.isFolder() && file.getStoragePath() != null) {
                try {
                    Files.deleteIfExists(storageConfig.resolveRelativePath(file.getStoragePath()));
                } catch (IOException e) {
                    log.warn("Failed to delete physical file: {}", file.getStoragePath(), e);
                }
            }

            fileRepository.delete(file);
        }
    }

    // ---------- Upload ----------

    @Transactional
    public FileResponse uploadFile(UUID userId, MultipartFile multipartFile, UUID parentId) {
        if (parentId != null) {
            fileRepository.findByIdAndUserIdAndIsDeletedFalse(parentId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("父文件夹", parentId));
        }

        String originalName = multipartFile.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            throw new BusinessException("文件名不能为空");
        }

        checkDuplicateName(userId, parentId, originalName);

        // ---- 配额检查：在写文件之前做 ----
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户未找到"));
        long fileSize = multipartFile.getSize();
        if (user.getStorageUsed() + fileSize > user.getStorageQuota()) {
            throw new BusinessException("存储空间不足");
        }

        // ---- 清理文件名：防止路径遍历 ----
        String safeName = originalName
                .replaceAll("[/\\\\]", "_")     // 替换 / 和 \
                .replaceAll("^\\.\\.+", "")     // 移除前导 ..
                .replaceAll("[\0]", "");        // 移除空字符
        if (safeName.isBlank()) {
            throw new BusinessException("文件名不合法");
        }

        // Build storage path: {userId}/{uuid}_{safeName}
        String uuid = UUID.randomUUID().toString();
        String storageFileName = uuid + "_" + safeName;
        String relativePath = userId.toString() + "/" + storageFileName;
        Path targetPath = storageConfig.resolveRelativePath(relativePath);

        try {
            Files.createDirectories(targetPath.getParent());

            // ---- 流式复制 + SHA256 同时计算 ----
            String fileHash;
            try (InputStream is = multipartFile.getInputStream()) {
                fileHash = calculateSha256WithCopy(is, targetPath);
            }

            // Detect content type
            String contentType = multipartFile.getContentType();
            if (contentType == null) {
                contentType = Files.probeContentType(targetPath);
            }

            FileEntity file = FileEntity.builder()
                    .userId(userId)
                    .parentId(parentId)
                    .name(originalName)
                    .isFolder(false)
                    .mimeType(contentType)
                    .sizeBytes(fileSize)
                    .storagePath(relativePath)
                    .fileHash(fileHash)
                    .build();

            // Update user storage used（仅在文件成功写入后扣减）
            user.setStorageUsed(user.getStorageUsed() + fileSize);
            userRepository.save(user);

            FileEntity savedFile = fileRepository.save(file);

            // Register media metadata if applicable
            if (contentType != null && (contentType.startsWith("image/")
                    || contentType.startsWith("video/")
                    || contentType.startsWith("audio/"))) {
                try {
                    mediaService.registerMedia(savedFile.getId(), savedFile.getStoragePath(), contentType);
                } catch (Exception e) {
                    log.warn("Failed to register media metadata for file: {}", savedFile.getId(), e);
                }
            }

            // Notify file change
            fileChangeHandler.notifyFileChange(userId, "create", savedFile.getId());

            return FileResponse.fromEntity(savedFile);

        } catch (BusinessException e) {
            throw e;
        } catch (IOException e) {
            throw new BusinessException("文件上传失败: " + e.getMessage());
        }
    }

    // ---------- Download (with Range support) ----------

    public DownloadResult getDownloadResource(UUID userId, UUID fileId, String rangeHeader) {
        FileEntity file = fileRepository.findByIdAndUserIdAndIsDeletedFalse(fileId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("文件", fileId));

        if (file.isFolder()) {
            throw new BusinessException("无法下载文件夹");
        }

        Path filePath = storageConfig.resolveRelativePath(file.getStoragePath());
        if (!Files.exists(filePath)) {
            throw new ResourceNotFoundException("文件存储丢失: " + file.getName());
        }

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

    // ---------- Search ----------

    public List<FileResponse> searchFiles(UUID userId, String keyword) {
        return fileRepository.searchByUserIdAndKeyword(userId, keyword).stream()
                .map(FileResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // ---------- Helpers ----------

    private void checkDuplicateName(UUID userId, UUID parentId, String name) {
        Optional<FileEntity> existing = fileRepository
                .findByUserIdAndParentIdAndNameAndIsDeletedFalse(userId, parentId, name);
        if (existing.isPresent()) {
            throw new BusinessException("同一目录下已存在同名文件/文件夹: " + name);
        }
    }

    /**
     * 从 InputStream 复制到目标文件，同时计算 SHA256，省去一次磁盘回读
     */
    private String calculateSha256WithCopy(InputStream is, Path targetPath) throws IOException {
        MessageDigest md;
        try {
            md = MessageDigest.getInstance("SHA-256");
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }

        try (DigestInputStream dis = new DigestInputStream(is, md)) {
            Files.copy(dis, targetPath, StandardCopyOption.REPLACE_EXISTING);
        }

        byte[] digest = md.digest();
        StringBuilder sb = new StringBuilder();
        for (byte b : digest) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private String calculateSha256(Path filePath) throws IOException {
        MessageDigest md;
        try {
            md = MessageDigest.getInstance("SHA-256");
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }

        try (InputStream is = Files.newInputStream(filePath);
             DigestInputStream dis = new DigestInputStream(is, md)) {
            byte[] buffer = new byte[8192];
            while (dis.read(buffer) != -1) {
                // reading is enough
            }
        }

        byte[] digest = md.digest();
        StringBuilder sb = new StringBuilder();
        for (byte b : digest) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    // ---------- Helpers ----------
}
