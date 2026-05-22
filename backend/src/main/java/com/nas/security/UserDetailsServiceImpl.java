package com.nas.security;

import com.nas.model.User;
import com.nas.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.UUID;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String usernameOrId) throws UsernameNotFoundException {
        // 先按用户名查找（兼容登录）
        User user = userRepository.findByUsername(usernameOrId)
                .orElse(null);

        // 再按UUID查找（JWT认证时使用）
        if (user == null) {
            try {
                user = userRepository.findById(UUID.fromString(usernameOrId))
                        .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + usernameOrId));
            } catch (IllegalArgumentException e) {
                throw new UsernameNotFoundException("用户不存在: " + usernameOrId);
            }
        }

        return new org.springframework.security.core.userdetails.User(
                user.getId().toString(),
                user.getPasswordHash(),
                new ArrayList<>());
    }
}
