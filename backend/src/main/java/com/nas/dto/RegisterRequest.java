package com.nas.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 50, message = "用户名长度需要在3-50个字符之间")
    @Pattern(regexp = "^[a-zA-Z0-9_-]{3,50}$", message = "用户名只能包含字母、数字、下划线和短横线")
    private String username;

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Size(max = 255, message = "邮箱长度不能超过255个字符")
    private String email;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 100, message = "密码长度需要在6-100个字符之间")
    private String password;
}
