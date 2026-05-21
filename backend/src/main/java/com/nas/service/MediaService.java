package com.nas.service;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Directory;
import com.drew.metadata.Metadata;
import com.drew.metadata.Tag;
import com.drew.metadata.exif.GpsDirectory;
import com.nas.config.StorageConfig;
import com.nas.dto.MediaResponse;
import com.nas.exception.ResourceNotFoundException;
import com.nas.model.FileEntity;
import com.nas.model.MediaMeta;
import com.nas.repository.FileRepository;
import com.nas.repository.MediaMetaRepository;
import com.nas.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MediaService {

    private static final Logger log = LoggerFactory.getLogger(MediaService.class);

    private final MediaMetaRepository mediaMetaRepository;
    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final StorageConfig storageConfig;
    private final ThumbnailService thumbnailService;

    public MediaService(MediaMetaRepository mediaMetaRepository,
                        FileRepository fileRepository,
                        UserRepository userRepository,
                        StorageConfig storageConfig,
                        ThumbnailService thumbnailService) {
        this.mediaMetaRepository = mediaMetaRepository;
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.storageConfig = storageConfig;
        this.thumbnailService = thumbnailService;
    }

    /**
     * Register media metadata after a file upload.
     */
    @Transactional
    public MediaMeta registerMedia(UUID fileId, String storagePath, String mimeType) {
        String mediaType = detectMediaType(mimeType);
        if (mediaType == null) {
            return null;
        }

        MediaMeta meta = MediaMeta.builder()
                .fileId(fileId)
                .mediaType(mediaType)
                .build();

        // Extract EXIF for images
        if ("image".equals(mediaType) && storagePath != null) {
            try {
                Path fullPath = storageConfig.resolveRelativePath(storagePath);
                if (fullPath.toFile().exists()) {
                    Map<String, Object> exifInfo = extractExif(fullPath.toString());
                    @SuppressWarnings("unchecked")
                    Map<String, Object> exif = (Map<String, Object>) exifInfo.get("exif");
                    if (exif != null) {
                        String exifJson = (String) exif.get("raw");
                        meta.setExifData(exifJson);

                        Integer width = (Integer) exif.get("width");
                        if (width != null && width > 0) meta.setWidth(width);

                        Integer height = (Integer) exif.get("height");
                        if (height != null && height > 0) meta.setHeight(height);

                        Double lat = (Double) exifInfo.get("gpsLat");
                        if (lat != null) meta.setGpsLat(lat);

                        Double lng = (Double) exifInfo.get("gpsLng");
                        if (lng != null) meta.setGpsLng(lng);

                        LocalDateTime takenAt = (LocalDateTime) exifInfo.get("takenAt");
                        if (takenAt != null) meta.setTakenAt(takenAt);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to extract EXIF for file: {}", storagePath, e);
            }
        }

        // Save meta first so thumbnail service can update hasThumbnail
        MediaMeta savedMeta = mediaMetaRepository.save(meta);

        // Generate thumbnail
        thumbnailService.generateThumbnail(fileId, storagePath, mimeType);

        return savedMeta;
    }

    /**
     * Get paginated media list by user and type.
     */
    public Page<MediaResponse> getMediaList(UUID userId, String type, int page, int size) {
        List<FileEntity> userFiles = fileRepository.findByUserIdAndIsDeletedFalse(userId);

        // Build a map: fileId -> FileEntity for fast lookup
        Map<UUID, FileEntity> fileMap = userFiles.stream()
                .filter(f -> !f.isFolder())
                .collect(Collectors.toMap(FileEntity::getId, f -> f, (a, b) -> a));

        if (fileMap.isEmpty()) {
            return Page.empty();
        }

        // Get all media meta entries matching the type filter
        List<MediaMeta> allMetas = mediaMetaRepository.findAll().stream()
                .filter(m -> fileMap.containsKey(m.getFileId()))
                .filter(m -> type == null || type.isEmpty() || type.equals(m.getMediaType()))
                .collect(Collectors.toList());

        // Sort by createdAt descending
        allMetas.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        // Manual pagination
        int start = page * size;
        if (start >= allMetas.size()) {
            return Page.empty();
        }
        int end = Math.min(start + size, allMetas.size());
        List<MediaMeta> pageContent = allMetas.subList(start, end);

        List<MediaResponse> responses = pageContent.stream()
                .map(meta -> buildResponse(meta, fileMap.get(meta.getFileId())))
                .collect(Collectors.toList());

        return new org.springframework.data.domain.PageImpl<>(responses,
                PageRequest.of(page, size), allMetas.size());
    }

    /**
     * Get media grouped by year-month for timeline view.
     */
    public Map<String, List<MediaResponse>> getMediaTimeline(UUID userId, String type, int year, int month) {
        Map<String, List<MediaResponse>> timeline = new LinkedHashMap<>();

        List<FileEntity> userFiles = fileRepository.findByUserIdAndIsDeletedFalse(userId);
        Map<UUID, FileEntity> fileMap = userFiles.stream()
                .filter(f -> !f.isFolder())
                .collect(Collectors.toMap(FileEntity::getId, f -> f, (a, b) -> a));

        List<MediaMeta> metas = mediaMetaRepository.findAll().stream()
                .filter(m -> fileMap.containsKey(m.getFileId()))
                .filter(m -> type == null || type.isEmpty() || type.equals(m.getMediaType()))
                .collect(Collectors.toList());

        for (MediaMeta meta : metas) {
            LocalDateTime dt = meta.getTakenAt() != null ? meta.getTakenAt() : meta.getCreatedAt();
            String key = dt.getYear() + "-" + String.format("%02d", dt.getMonthValue());

            // Filter by year/month if provided
            if (year > 0 && dt.getYear() != year) continue;
            if (month > 0 && dt.getMonthValue() != month) continue;

            timeline.computeIfAbsent(key, k -> new ArrayList<>())
                    .add(buildResponse(meta, fileMap.get(meta.getFileId())));
        }

        return timeline;
    }

    /**
     * Get detailed media info for a single file.
     */
    public MediaResponse getMediaDetail(UUID userId, UUID fileId) {
        // 先验证文件属于当前用户
        FileEntity file = fileRepository.findByIdAndUserIdAndIsDeletedFalse(fileId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("文件", fileId));

        MediaMeta meta = mediaMetaRepository.findByFileId(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("媒体文件", fileId));

        return buildResponse(meta, file);
    }

    /**
     * Get all media entries that have GPS coordinates.
     */
    public List<MediaResponse> getMediaLocations(UUID userId) {
        List<FileEntity> userFiles = fileRepository.findByUserIdAndIsDeletedFalse(userId);
        Map<UUID, FileEntity> fileMap = userFiles.stream()
                .filter(f -> !f.isFolder())
                .collect(Collectors.toMap(FileEntity::getId, f -> f, (a, b) -> a));

        return mediaMetaRepository.findAll().stream()
                .filter(m -> fileMap.containsKey(m.getFileId()))
                .filter(m -> m.getGpsLat() != null && m.getGpsLng() != null)
                .map(m -> buildResponse(m, fileMap.get(m.getFileId())))
                .collect(Collectors.toList());
    }

    // ---- Private helpers ----

    private String detectMediaType(String mimeType) {
        if (mimeType == null) return null;
        if (mimeType.startsWith("image/")) return "image";
        if (mimeType.startsWith("video/")) return "video";
        if (mimeType.startsWith("audio/")) return "audio";
        if (mimeType.equals("application/pdf")
                || mimeType.startsWith("application/msword")
                || mimeType.startsWith("application/vnd.openxmlformats-officedocument")
                || mimeType.startsWith("application/vnd.ms-")
                || mimeType.equals("text/plain")
                || mimeType.equals("text/csv")) {
            return "document";
        }
        return null;
    }

    private MediaResponse buildResponse(MediaMeta meta, FileEntity file) {
        return MediaResponse.builder()
                .id(meta.getId())
                .fileId(meta.getFileId())
                .fileName(file != null ? file.getName() : null)
                .mediaType(meta.getMediaType())
                .fileSize(file != null ? file.getSizeBytes() : null)
                .mimeType(file != null ? file.getMimeType() : null)
                .width(meta.getWidth())
                .height(meta.getHeight())
                .durationMs(meta.getDurationMs())
                .gpsLat(meta.getGpsLat())
                .gpsLng(meta.getGpsLng())
                .takenAt(meta.getTakenAt())
                .createdAt(meta.getCreatedAt())
                .hasThumbnail(meta.isHasThumbnail())
                .build();
    }

    /**
     * Extract EXIF metadata from an image file using metadata-extractor.
     * Returns a map with structured fields.
     */
    private Map<String, Object> extractExif(String storagePath) {
        Map<String, Object> result = new HashMap<>();
        try {
            File file = new File(storagePath);
            Metadata metadata = ImageMetadataReader.readMetadata(file);

            StringBuilder exifJson = new StringBuilder("{");

            // Extract GPS
            GpsDirectory gpsDir = metadata.getFirstDirectoryOfType(GpsDirectory.class);
            if (gpsDir != null) {
                if (gpsDir.getGeoLocation() != null) {
                    result.put("gpsLat", gpsDir.getGeoLocation().getLatitude());
                    result.put("gpsLng", gpsDir.getGeoLocation().getLongitude());
                }
                Date gpsDate = gpsDir.getGpsDate();
                if (gpsDate != null) {
                    result.put("takenAt", gpsDate.toInstant()
                            .atZone(ZoneId.systemDefault()).toLocalDateTime());
                }
            }

            // Extract image dimensions and other metadata
            boolean first = true;
            for (Directory dir : metadata.getDirectories()) {
                for (Tag tag : dir.getTags()) {
                    if (!first) exifJson.append(",");
                    first = false;
                    exifJson.append("\"")
                            .append(escapeJson(tag.getDirectoryName()))
                            .append(".")
                            .append(escapeJson(tag.getTagName()))
                            .append("\":\"")
                            .append(escapeJson(tag.getDescription()))
                            .append("\"");

                    // Capture width/height from different directories
                    String tagName = tag.getTagName().toLowerCase();
                    if (tagName.contains("width") || tagName.contains("image width")
                            || "exif image width".equals(tagName)) {
                        try {
                            int w = Integer.parseInt(tag.getDescription()
                                    .replaceAll("[^0-9]", ""));
                            if (w > 0) result.put("width", w);
                        } catch (NumberFormatException ignored) {}
                    }
                    if (tagName.contains("height") || tagName.contains("image height")
                            || "exif image height".equals(tagName)) {
                        try {
                            int h = Integer.parseInt(tag.getDescription()
                                    .replaceAll("[^0-9]", ""));
                            if (h > 0) result.put("height", h);
                        } catch (NumberFormatException ignored) {}
                    }
                }
            }

            exifJson.append("}");

            Map<String, Object> exifResult = new HashMap<>();
            exifResult.put("raw", exifJson.toString());
            exifResult.put("width", result.get("width"));
            exifResult.put("height", result.get("height"));
            result.put("exif", exifResult);

        } catch (Exception e) {
            log.debug("Could not extract EXIF from: {}", storagePath, e);
            result.put("exif", Collections.singletonMap("raw", "{}"));
        }

        return result;
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
