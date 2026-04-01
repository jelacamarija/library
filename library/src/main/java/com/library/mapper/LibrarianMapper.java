package com.library.mapper;

import com.library.dto.LibrarianListDto;
import com.library.entity.Librarian;

public class LibrarianMapper {

    private LibrarianMapper() {
    }

    public static LibrarianListDto toListDto(Librarian librarian) {
        return new LibrarianListDto(
                librarian.getUserID(),
                librarian.getName(),
                librarian.getEmail(),
                librarian.getPhoneNumber(),
                librarian.getEmployeeCode(),
                librarian.getActive(),
                librarian.getIsVerified()
        );
    }
}
