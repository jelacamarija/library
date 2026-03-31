package com.library.mapper;

import com.library.dto.ClientProfileDto;
import com.library.dto.UserListDto;
import com.library.entity.Client;
import com.library.entity.Membership;

public class ClientMapper {

    private ClientMapper() {
    }


    public static ClientProfileDto toProfileDto(Client client, Membership membership) {
        return new ClientProfileDto(
                client.getUserID(),
                client.getName(),
                client.getEmail(),
                client.getPhoneNumber(),
                membership!=null ? membership.getMembershipID():null,
                client.getMembershipNumber(),
                client.getIsVerified(),
                client.getActive(),
                client.getCreatedAt(),


                membership != null ? membership.getStatus() : null,
                membership != null ? membership.getAmount() : null,
                membership != null ? membership.getStartDate() : null,
                membership != null ? membership.getEndDate() : null
        );
    }


    public static UserListDto toListDto(Client client, Membership membership) {
        return new UserListDto(
                client.getUserID(),
                client.getName(),
                client.getEmail(),
                client.getPhoneNumber(),
                client.getMembershipNumber(),

                membership != null ? membership.getStatus() : null,

                client.getActive(),
                client.getIsVerified(),
                client.getCreatedAt()
        );
    }
}