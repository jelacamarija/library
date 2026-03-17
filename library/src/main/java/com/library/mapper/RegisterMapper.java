package com.library.mapper;

import com.library.dto.RegisterRequestDto;
import com.library.entity.Client;
import com.library.entity.User;

public class RegisterMapper {

    private RegisterMapper() {
    }

    public static Client toClientEntity(RegisterRequestDto dto) {
        return Client.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .phoneNumber(dto.getPhoneNumber())
                .active(true)
                .isVerified(false)
                .membershipNumber(null)
                .build();
    }
}
