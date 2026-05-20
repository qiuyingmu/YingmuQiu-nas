package com.nas.repository;

import com.nas.model.MediaMeta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MediaMetaRepository extends JpaRepository<MediaMeta, UUID> {

    Optional<MediaMeta> findByFileId(UUID fileId);

    void deleteByFileId(UUID fileId);

    @Query("SELECT m FROM MediaMeta m JOIN FileEntity f ON m.fileId = f.id WHERE f.userId = :userId")
    List<MediaMeta> findByUserId(@Param("userId") UUID userId);
}
