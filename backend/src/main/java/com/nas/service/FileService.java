package com.nas.service;

import com.nas.config.StorageConfig;
import com.nas.dto.FileResponse;
import com.nas.exception.BusinessException;
import com.nas.exception.ResourceNotFoundException;
import com.nas.model.FileEntity;
import com.nas.model.User;
import com.nas.repository.FileRepository;
import com.nas.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
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

    public FileService(FileRepository fileRepository,
                       UserRepository userRepository,
                       StorageConfig storageConfig,
                       MediaService mediaService) {
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.storageConfig = storageConfig;
        this.mediaService = mediaService;
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
                    .orElseThrow(() -> new ResourceNotFoundException("????", parentId));
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
                .orElseThrow(() -> new ResourceNotFoundException("??", fileId));

        if (name != null && !name.equals(file.getName())) {
            UUID targetParentId = parentId != null ? parentId : file.getParentId();
            checkDuplicateName(userId, targetParentId, name);
            file.setName(name);
        }

        if (parentId != null && !parentId.equals(file.getParentId())) {
            // Verify new parent exists
            fileRepository.findByIdAndUserIdAndIsDeletedFalse(parentId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("????", parentId));
            checkDuplicateName(userId, parentId, file.getName());
            file.setParentId(parentId);
        }

        return FileResponse.fromEntity(fileRepository.save(file));
    }

    // ---------- Delete (move to trash) ----------

    @Transactional
    public void deleteFiles(UUID userId, List<UUID> ids) {
        for (UUID id : ids) {
            FileEntity file = fileRepository.findByIdAndUserIdAndIsDeletedFalse(id, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("??", id));
            softDelete(file);
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
                    .orElseThrow(() -> new ResourceNotFoundException("??", id));

            if (!file.getUserId().equals(userId)) {
                throw new BusinessException("???????");
            }

            file.setDeleted(false);
            file.setDeletedAt(null);
            fileRepository.save(file);
        }
    }

    @Transactional
    public void emptyTrash(UUID userId, List<UUID> ids) {
        for (UUID id : ids) {
            FileEntity file = fileRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("??", id));

            if (!file.getUserId().equals(userId)) {
                throw new BusinessException("???????");
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
                    .orElseThrow(() -> new ResourceNotFoundException("????", parentId));
        }

        String originalName = multipartFile.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            throw new BusinessException("???????");
        }

        checkDuplicateName(userId, parentId, originalName);

        // Build storage path: {userId}/{uuid}_{originalName}
        String uuid = UUID.randomUUID().toString();
        String storageFileName = uuid + "_" + originalName;
        String relativePath = userId.toString() + "/" + storageFileName;
        Path targetPath = storageConfig.resolveRelativePath(relativePath);

        try {
            Files.createDirectories(targetPath.getParent());
            Files.copy(multipartFile.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Calculate SHA256 hash
            String fileHash = calculateSha256(targetPath);

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
                    .sizeBytes(multipartFile.getSize())
                    .storagePath(relativePath)
                    .fileHash(fileHash)
                    .build();

            // Update user storage used
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new BusinessException("?????"));
            if (user.getStorageUsed() + multipartFile.getSize() > user.getStorageQuota()) {
                // Clean up uploaded file
                Files.deleteIfExists(targetPath);
                throw new BusinessException("??????");
            }
            user.setStorageUsed(user.getStorageUsed() + multipartFile.getSize());
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

            return FileResponse.fromEntity(savedFile);

        } catch (BusinessException e) {
            throw e;
        } catch (IOException e) {
            throw new BusinessException("??????: " + e.getMessage());
        }
    }

    // ---------- Download (with Range support) ----------

    public DownloadResult getDownloadResource(UUID userId, UUID fileId, String rangeHeader) {
        FileEntity file = fileRepository.findByIdAndUserIdAndIsDeletedFalse(fileId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("??", fileId));

        if (file.isFolder()) {
            throw new BusinessException("???????");
        }

        Path filePath = storageConfig.resolveRelativePath(file.getStoragePath());
        if (!Files.exists(filePath)) {
            throw new ResourceNotFoundException("??????: " + file.getName());
        }

        long fileLength = file.getSizeBytes();
        long start = 0;
        long end = fileLength - 1;
        String contentType = file.getMimeType() != null ? file.getMimeType() : "application/octet-stream";
        String contentDisposition = "attachment; filename=\"" + file.getName() + "\"";

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
                    throw new BusinessException("Range ????");
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
            throw new BusinessException("????????????/???: " + name);
        }
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

    // ---------- DownloadResult inner class ----------

    public static class DownloadResult {
        private final Resource resource;
        private final String contentType;
        private final String contentDisposition;
        private final long contentLength;
        private final long start;
        private final long end;
        private final long fileLength;
        private final boolean isPartial;

        public DownloadResult(Resource resource, String contentType, String contentDisposition,
                              long contentLength, long start, long end, long fileLength,
                              boolean isPartial) {
            this.resource = resource;
            this.contentType = contentType;
            this.contentDisposition = contentDisposition;
            this.contentLength = contentLength;
            this.start = start;
            this.end = end;
            this.fileLength = fileLength;
            this.isPartial = isPartial;
        }

        public Resource getResource() { return resource; }
        public String getContentType() { return contentType; }
        public String getContentDisposition() { return contentDisposition; }
        public long getContentLength() { return contentLength; }
        public long getStart() { return start; }
        public long getEnd() { return end; }
        public long getFileLength() { return fileLength; }
        public boolean isPartial() { return isPartial; }
    }
}
