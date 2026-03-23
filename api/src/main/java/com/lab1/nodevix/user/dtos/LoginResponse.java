package com.lab1.nodevix.user.dtos;

public class LoginResponse {
    private Long id;
    private String email;

    public LoginResponse(Long id,String email) {
        this.id = id;
        this.email = email;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }


}
