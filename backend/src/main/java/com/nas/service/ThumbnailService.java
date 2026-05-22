package com.nas.service;

import com.nas.config.StorageConfig;
import com.nas.model.MediaMeta;
import com.nas.repository.MediaMetaRepository;
import net.coobird.thumbnailator.Thumbnails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class ThumbnailService {

    private static final Logger log = LoggerFactory.getLogger(ThumbnailService.class);

    private static final int SMALL_SIZE = 200;
    private static final int MEDIUM_SIZE = 400;

    private final StorageConfig storageConfig;
    private final MediaMetaRepository mediaMetaRepository;

    @Value("${app.ffmpeg.path:ffmpeg}")
    private String ffmpegPath;

    public ThumbnailService(StorageConfig storageConfig, MediaMetaRepository mediaMetaRepository) {
        this.storageConfig = storageConfig;
        this.mediaMetaRepository = mediaMetaRepository;
    }

    /**
     * Generate thumbnails for a media file. Skips generation if already exists.
     */
    public void generateThumbnail(UUID fileId, String storagePath, String mimeType) {
        if (mimeType == null) {
            return;
        }

        Path sourceFile = storageConfig.resolveRelativePath(storagePath);
        if (!Files.exists(sourceFile)) {
            log.warn("Source file not found for thumbnail generation: {}", storagePath);
            return;
        }

        try {
            if (mimeType.startsWith("image/")) {
                generateImageThumbnails(fileId, sourceFile);
            } else if (mimeType.startsWith("video/")) {
                generateVideoThumbnail(fileId, sourceFile);
            } else {
                // Audio and other types: no thumbnail generation
                return;
            }

            // Mark hasThumbnail in media meta
            mediaMetaRepository.findByFileId(fileId).ifPresent(meta -> {
                meta.setHasThumbnail(true);
                mediaMetaRepository.save(meta);
            });
        } catch (Exception e) {
            log.error("Failed to generate thumbnail for file: {}", storagePath, e);
        }
    }

    /**
     * Get the path to a thumbnail file.
     */
    public Path getThumbnailPath(UUID fileId, String size) {
        Path thumbDir = getThumbnailDir();
        return thumbDir.resolve(fileId.toString() + "_" + size + ".jpg");
    }

    /**
     * Check if a thumbnail exists for the given file.
     */
    public boolean hasThumbnail(UUID fileId) {
        Path small = getThumbnailPath(fileId, "small");
        return Files.exists(small);
    }

    // ---- Private helpers ----

    private void generateImageThumbnails(UUID fileId, Path sourceFile) throws IOException {
        Thumbnails.of(sourceFile.toFile())
                .size(SMALL_SIZE, SMALL_SIZE)
                .outputFormat("jpg")
                .toFile(getThumbnailPath(fileId, "small").toFile());

        Thumbnails.of(sourceFile.toFile())
                .size(MEDIUM_SIZE, MEDIUM_SIZE)
                .outputFormat("jpg")
                .toFile(getThumbnailPath(fileId, "medium").toFile());

        log.debug("Generated image thumbnails for file: {}", fileId);
    }

    private void generateVideoThumbnail(UUID fileId, Path sourceFile) {
        Path output = getThumbnailPath(fileId, "medium");
        if (Files.exists(output)) {
            return;
        }

        // Validate paths are within storage directory
        Path storagePath = storageConfig.getStoragePath();
        if (!sourceFile.normalize().startsWith(storagePath)
                || !output.normalize().startsWith(storagePath)) {
            log.warn("Invalid path for video thumbnail generation: source={}, output={}", sourceFile, output);
            return;
        }

        // 智能选取缩略图时间点：取视频时长 30% 或 5 秒中的较小值
        String seekTime = "00:00:01"; // 默认取第 1 秒
        try {
            ProcessBuilder probePb = new ProcessBuilder(
                    ffmpegPath.replace("ffmpeg", "ffprobe"),
                    "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "csv=p=0",
                    sourceFile.toAbsolutePath().toString()
            );
            Process probeProcess = probePb.start();
            try (java.io.BufferedReader reader = new java.io.BufferedReader(
                    new java.io.InputStreamReader(probeProcess.getInputStream()))) {
                String line = reader.readLine();
                if (line != null) {
                    double duration = Double.parseDouble(line.trim());
                    double seekSec = Math.min(duration * 0.3, 5.0);
                    if (seekSec > 0.5) {
                        int hh = (int) seekSec / 3600;
                        int mm = (int) (seekSec % 3600) / 60;
                        double ss = seekSec % 60;
                        seekTime = String.format("%02d:%02d:%05.2f", hh, mm, ss);
                    }
                }
            }
            probeProcess.waitFor();
        } catch (Exception e) {
            log.debug("Could not probe video duration, using default seek: 1s");
        }

        ProcessBuilder pb = new ProcessBuilder(
                ffmpegPath,
                "-ss", seekTime,  // 放在 -i 之前加速 seek
                "-i", sourceFile.toAbsolutePath().toString(),
                "-vframes", "1",
                "-s", MEDIUM_SIZE + "x" + MEDIUM_SIZE,
                "-f", "image2",
                output.toAbsolutePath().toString()
        );

        try {
            Process process = pb.start();
            int exitCode = process.waitFor();
            if (exitCode == 0) {
                // Copy medium as small for video
                Files.copy(output, getThumbnailPath(fileId, "small"));
                log.debug("Generated video thumbnail for file: {}", fileId);
            } else {
                log.warn("FFmpeg thumbnail generation failed with exit code {} for file: {}",
                        exitCode, fileId);
            }
        } catch (IOException | InterruptedException e) {
            log.error("FFmpeg thumbnail generation error for file: {}", fileId, e);
            Thread.currentThread().interrupt();
        }
    }

    private Path getThumbnailDir() {
        Path dir = storageConfig.getStoragePath().resolve("thumbnails");
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            throw new RuntimeException("无法创建缩略图目录: " + dir, e);
        }
        return dir;
    }
}
