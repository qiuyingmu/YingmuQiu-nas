package com.nas.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "???????")
    @Size(min = 3, max = 50, message = "???????3-50?????")
    private String username;

    @NotBlank(message = "??????")
    @Email(message = "???????")
    private String email;

    @NotBlank(message = "??????")
    @Size(min = 6, max = 100, message = "??????6-100?????")
    private String password;
}
