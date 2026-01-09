package com.library.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequestDto {

    private String name;
    private String email;
    private String password;

    @NotBlank
    @Pattern(regexp = "^[+0-9\\s\\-()]{6,20}$", message = "Broj telefona nije validan.")
    private String phoneNumber;

}
