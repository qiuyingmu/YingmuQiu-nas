package com.nas.repository;

import com.nas.model.MediaMeta;
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
public interface MediaMetaRepository extends JpaRepository<MediaMeta, UUID> {

    Optional<MediaMeta> findByFileId(UUID fileId);

    void deleteByFileId(UUID fileId);

    @Query("SELECT m FROM MediaMeta m JOIN FileEntity f ON m.fileId = f.id WHERE f.userId = :userId")
    List<MediaMeta> findByUserId(@Param("userId") UUID userId);

    /**
     * 按用户+媒体类型分页查询，数据库层面 JOIN + 过滤 + 排序。
     */
    @Query("SELECT m FROM MediaMeta m JOIN FileEntity f ON m.fileId = f.id "
         + "WHERE f.userId = :userId AND f.isDeleted = false "
         + "AND (:type IS NULL OR m.mediaType = :type)")
    Page<MediaMeta> findByUserIdAndTypePaged(@Param("userId") UUID userId,
                                              @Param("type") String type,
                                              Pageable pageable);

    /**
     * 按用户+媒体类型获取全部记录（用于时间线/地图等需要全部数据的场景）。
     */
    @Query("SELECT m FROM MediaMeta m JOIN FileEntity f ON m.fileId = f.id "
         + "WHERE f.userId = :userId AND f.isDeleted = false "
         + "AND (:type IS NULL OR m.mediaType = :type)")
    List<MediaMeta> findAllByUserIdAndType(@Param("userId") UUID userId,
                                            @Param("type") String type);
}
