package com.library.mapper;

import com.library.dto.UserListDto;
import com.library.dto.UserProfileDto;
import com.library.entity.User;

public class UserMapper {

    public static UserProfileDto toProfileDto(User user) {
        return new UserProfileDto(
                user.getUserID(),
                user.getName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getMembershipNumber(),
                user.getMembershipDate(),
                user.getIsVerified(),
                user.getActive(),
                user.getCreatedAt(),
                user.getRole()
        );
    }

    public static UserListDto toListDto(User user) {
        return new UserListDto(
                user.getUserID(),
                user.getName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getMembershipNumber(),
                user.getMembershipDate(),
                user.getActive(),
                user.getIsVerified()
        );
    }
}
