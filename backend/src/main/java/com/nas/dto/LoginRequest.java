package com.nas.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "???????")
    private String username;

    @NotBlank(message = "??????")
    private String password;
}
