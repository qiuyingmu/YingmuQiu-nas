package com.nas.repository;

import com.nas.model.FileEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FileRepository extends JpaRepository<FileEntity, UUID> {

    List<FileEntity> findByUserIdAndParentIdAndIsDeletedFalse(UUID userId, UUID parentId);

    Page<FileEntity> findByUserIdAndParentIdAndIsDeletedFalse(UUID userId, UUID parentId, Pageable pageable);

    Optional<FileEntity> findByIdAndUserIdAndIsDeletedFalse(UUID id, UUID userId);

    @Query("SELECT f FROM FileEntity f WHERE f.userId = :userId " +
           "AND ((:parentId IS NULL AND f.parentId IS NULL) OR (f.parentId = :parentId)) " +
           "AND f.name = :name AND f.isDeleted = false")
    Optional<FileEntity> findByUserIdAndParentIdAndNameAndIsDeletedFalse(
            @Param("userId") UUID userId,
            @Param("parentId") UUID parentId,
            @Param("name") String name);

    @Query("SELECT f FROM FileEntity f WHERE f.userId = :userId AND f.parentId IS NULL AND f.isDeleted = false")
    List<FileEntity> findRootByUserId(@Param("userId") UUID userId);

    // Trash
    List<FileEntity> findByUserIdAndIsDeletedTrue(UUID userId);

    // Search
    @Query("SELECT f FROM FileEntity f WHERE f.userId = :userId AND f.isDeleted = false " +
           "AND f.isFolder = false AND LOWER(f.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<FileEntity> searchByUserIdAndKeyword(@Param("userId") UUID userId, @Param("keyword") String keyword);

    // Tree: find all non-deleted folders for a user
    @Query("SELECT f FROM FileEntity f WHERE f.userId = :userId AND f.isDeleted = false " +
           "AND f.isFolder = true")
    List<FileEntity> findAllFoldersByUserId(@Param("userId") UUID userId);

    // Find children for cascade delete (user-isolated)
    List<FileEntity> findByParentIdAndUserIdAndIsDeletedFalse(UUID parentId, UUID userId);

    // Find all children (including deleted) by parentId
    List<FileEntity> findByParentId(UUID parentId);

    // Find all non-deleted files for a user (media use)
    List<FileEntity> findByUserIdAndIsDeletedFalse(UUID userId);

    // Count children
    long countByParentIdAndIsDeletedFalse(UUID parentId);
}
