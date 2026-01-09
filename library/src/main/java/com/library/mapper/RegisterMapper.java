package com.library.mapper;

import com.library.dto.RegisterRequestDto;
import com.library.entity.User;

public class RegisterMapper {

    public static User toEntity(RegisterRequestDto dto){
        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(dto.getPassword());
        user.setPhoneNumber(dto.getPhoneNumber());
        return user;
    }
}
