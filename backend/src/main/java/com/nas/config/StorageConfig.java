package com.nas.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class StorageConfig {

    private static final Logger log = LoggerFactory.getLogger(StorageConfig.class);

    @Value("${app.storage.dir:./nas-data}")
    private String storageDir;

    private Path storagePath;

    @PostConstruct
    public void init() {
        storagePath = Paths.get(storageDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(storagePath);
            log.info("Storage directory initialized at: {}", storagePath);
        } catch (Exception e) {
            throw new RuntimeException("????????: " + storagePath, e);
        }
    }

    public Path getStoragePath() {
        return storagePath;
    }

    public Path resolveRelativePath(String relativePath) {
        return storagePath.resolve(relativePath).normalize();
    }
}
