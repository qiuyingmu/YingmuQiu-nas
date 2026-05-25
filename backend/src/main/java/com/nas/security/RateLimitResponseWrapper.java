package com.nas.security;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;

/**
 * 包装 Response，捕获登录失败的状态码
 */
class RateLimitResponseWrapper extends HttpServletResponseWrapper {

    private int httpStatus = SC_OK;

    public RateLimitResponseWrapper(HttpServletResponse response) {
        super(response);
    }

    @Override
    public void setStatus(int status) {
        this.httpStatus = status;
        super.setStatus(status);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void setStatus(int status, String sm) {
        this.httpStatus = status;
        super.setStatus(status, sm);
    }

    @Override
    public void sendError(int status, String msg) throws java.io.IOException {
        this.httpStatus = status;
        super.sendError(status, msg);
    }

    @Override
    public void sendError(int status) throws java.io.IOException {
        this.httpStatus = status;
        super.sendError(status);
    }

    public int getStatus() {
        return httpStatus;
    }
}
