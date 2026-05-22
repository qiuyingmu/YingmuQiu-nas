package com.nas.dto;

import jakarta.validation.constraints.NotNull;
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

    @NotNull(message = "请指定要分享的文件")
    private UUID fileId;

    private String password;

    private String expiresAt;

    private int maxDownloads;
}
