package com.library.dto;

import com.library.entity.BookStatus;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class BookInstanceResponseDto {

    private Long instanceID;

    private String inventoryNumber;
    private String location;
    private BookStatus status;

    private Long publicationID;
    private String isbn;

    private String bookTitle;

    private List<String> authors;
}
