package com.nas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareLinkRequest {

    private UUID fileId;

    private String password;

    private String expiresAt;

    private int maxDownloads;
}
