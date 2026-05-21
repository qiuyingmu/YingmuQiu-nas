package com.nas.repository;

import com.nas.model.ShareLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShareLinkRepository extends JpaRepository<ShareLink, UUID> {

    Optional<ShareLink> findByTokenAndIsActiveTrue(String token);

    List<ShareLink> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<ShareLink> findByFileIdAndUserIdAndIsActiveTrue(UUID fileId, UUID userId);
}
