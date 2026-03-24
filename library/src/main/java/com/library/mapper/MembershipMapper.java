package com.library.mapper;

import com.library.dto.MembershipResponseDto;
import com.library.entity.Membership;

public class MembershipMapper {

    public static MembershipResponseDto toDto(Membership membership) {

        return MembershipResponseDto.builder()
                .membershipId(membership.getMembershipID())
                .amount(membership.getAmount())
                .currency(membership.getCurrency())
                .status(membership.getStatus())
                .startDate(membership.getStartDate())
                .endDate(membership.getEndDate())
                .createdAt(membership.getCreatedAt())
                .build();
    }
}