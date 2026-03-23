package com.lab1.nodevix.user.dtos;

import java.util.Date;

public class RegisterResponse {
    private Long id;
    private String username;
    private String email;
    private Date birthDate;

    public RegisterResponse(Long id, String username, String email, Date birthDate) {
        this.id = id;
        this.username = username;
        this.email = email;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public Date getBirthDate() { return birthDate; }
}
