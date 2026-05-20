package com.nas.controller;

import com.nas.dto.ApiResponse;
import com.nas.dto.MediaResponse;
import com.nas.exception.ResourceNotFoundException;
import com.nas.model.MediaMeta;
import com.nas.repository.MediaMetaRepository;
import com.nas.service.MediaService;
import com.nas.service.ThumbnailService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    private final MediaService mediaService;
    private final ThumbnailService thumbnailService;
    private final MediaMetaRepository mediaMetaRepository;

    public MediaController(MediaService mediaService,
                           ThumbnailService thumbnailService,
                           MediaMetaRepository mediaMetaRepository) {
        this.mediaService = mediaService;
        this.thumbnailService = thumbnailService;
        this.mediaMetaRepository = mediaMetaRepository;
    }

    /**
     * Browse media by type with pagination.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<MediaResponse>>> getMediaList(
            Authentication auth,
            @RequestParam(defaultValue = "") String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int pageSize) {

        UUID userId = UUID.fromString(auth.getName());
        Page<MediaResponse> result = mediaService.getMediaList(userId, type, page, pageSize);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Browse media by timeline (year-month grouping).
     */
    @GetMapping("/timeline")
    public ResponseEntity<ApiResponse<Map<String, List<MediaResponse>>>> getMediaTimeline(
            Authentication auth,
            @RequestParam(defaultValue = "") String type,
            @RequestParam(defaultValue = "0") int year,
            @RequestParam(defaultValue = "0") int month) {

        UUID userId = UUID.fromString(auth.getName());
        Map<String, List<MediaResponse>> timeline = mediaService.getMediaTimeline(userId, type, year, month);
        return ResponseEntity.ok(ApiResponse.success(timeline));
    }

    /**
     * Get media detail by file ID.
     */
    @GetMapping("/{fileId}")
    public ResponseEntity<ApiResponse<MediaResponse>> getMediaDetail(
            Authentication auth,
            @PathVariable UUID fileId) {

        UUID userId = UUID.fromString(auth.getName());
        MediaResponse detail = mediaService.getMediaDetail(userId, fileId);

        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    /**
     * Get thumbnail image for a media file.
     */
    @GetMapping("/{fileId}/thumbnail")
    public ResponseEntity<Resource> getThumbnail(
            Authentication auth,
            @PathVariable UUID fileId,
            @RequestParam(defaultValue = "small") String size) {

        UUID userId = UUID.fromString(auth.getName());

        // Verify the media exists and the user owns it
        MediaResponse detail = mediaService.getMediaDetail(userId, fileId);

        if (!detail.isHasThumbnail()) {
            return ResponseEntity.notFound().build();
        }

        // Validate size parameter
        if (!"small".equals(size) && !"medium".equals(size)) {
            return ResponseEntity.badRequest().build();
        }

        Path thumbPath = thumbnailService.getThumbnailPath(fileId, size);
        if (!Files.exists(thumbPath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(thumbPath.toFile());
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(resource);
    }

    /**
     * Get media entries that have GPS location data.
     */
    @GetMapping("/locations")
    public ResponseEntity<ApiResponse<List<MediaResponse>>> getMediaLocations(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        List<MediaResponse> locations = mediaService.getMediaLocations(userId);
        return ResponseEntity.ok(ApiResponse.success(locations));
    }
}
