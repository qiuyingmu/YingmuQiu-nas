package com.nas.service;

import com.nas.config.StorageConfig;
import com.nas.exception.BusinessException;
import com.nas.exception.ResourceNotFoundException;
import com.nas.model.FileEntity;
import com.nas.model.User;
import com.nas.repository.FileRepository;
import com.nas.repository.UserRepository;
import com.nas.websocket.FileChangeHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    @Mock
    private FileRepository fileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StorageConfig storageConfig;

    @Mock
    private MediaService mediaService;

    @Mock
    private FileChangeHandler fileChangeHandler;

    private FileService fileService;
    private UUID userId;
    private UUID folderId;

    @BeforeEach
    void setUp() {
        fileService = new FileService(fileRepository, userRepository, storageConfig,
                mediaService, fileChangeHandler);
        userId = UUID.randomUUID();
        folderId = UUID.randomUUID();
    }

    @Test
    @DisplayName("创建文件夹成功")
    void createFolderSuccess() {
        when(fileRepository.findByUserIdAndParentIdAndNameAndIsDeletedFalse(
                eq(userId), eq(null), eq("NewFolder")))
                .thenReturn(Optional.empty());
        when(fileRepository.save(any(FileEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var result = fileService.createFolder(userId, "NewFolder", null);

        assertNotNull(result);
        assertEquals("NewFolder", result.getName());
        assertTrue(result.isFolder());
        verify(fileRepository).save(any(FileEntity.class));
    }

    @Test
    @DisplayName("创建同名文件夹抛出异常")
    void createFolderDuplicate() {
        FileEntity existing = FileEntity.builder()
                .id(folderId)
                .userId(userId)
                .name("ExistingFolder")
                .isFolder(true)
                .build();

        when(fileRepository.findByUserIdAndParentIdAndNameAndIsDeletedFalse(
                eq(userId), eq(null), eq("ExistingFolder")))
                .thenReturn(Optional.of(existing));

        assertThrows(BusinessException.class,
                () -> fileService.createFolder(userId, "ExistingFolder", null));
        verify(fileRepository, never()).save(any());
    }

    @Test
    @DisplayName("查询已删除文件抛出 404")
    void getDeletedFileThrowsNotFound() {
        UUID fileId = UUID.randomUUID();
        when(fileRepository.findByIdAndUserIdAndIsDeletedFalse(fileId, userId))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> fileService.getDownloadResource(userId, fileId, null));
    }

    @Test
    @DisplayName("创建根文件夹支持")
    void listRootFiles() {
        when(fileRepository.findRootByUserId(userId))
                .thenReturn(List.of());

        var result = fileService.listFiles(userId, null);

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(fileRepository).findRootByUserId(userId);
    }
}
