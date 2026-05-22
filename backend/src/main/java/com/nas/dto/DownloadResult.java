package com.nas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.springframework.core.io.Resource;

/**
 * 文件下载结果，包含资源引用及 Range 请求所需的偏移量信息。
 */
@Data
@Builder
@AllArgsConstructor
public class DownloadResult {

    private Resource resource;
    private String contentType;
    private String contentDisposition;
    private long contentLength;
    private long start;
    private long end;
    private long fileLength;
    private boolean isPartial;
}
