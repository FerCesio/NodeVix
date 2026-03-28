package com.lab1.nodevix.user.dtos;

import java.time.LocalDate;
import java.util.Date;

public class RegisterResponse {
    private Long id;
    private String userName;
    private String email;
    private String birthDate;

    public RegisterResponse(Long id, String username, String email, String birthDate) {
        this.id = id;
        this.userName = username;
        this.email = email;
        this.birthDate = birthDate;
    }

    public Long getId() { return id; }
    public String getUsername() { return userName; }
    public String getEmail() { return email; }
    public String getBirthDate() { return birthDate; }
}
