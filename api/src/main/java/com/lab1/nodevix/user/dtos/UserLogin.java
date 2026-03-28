package com.lab1.nodevix.user.dtos;

public class UserLogin {
    private String identifier;
    private String password;

    public void setIdentifier(String identifier) { this.identifier = identifier; }

    public void setPassword(String password) { this.password = password; }

    public String getPassword() { return this.password; }

    public String getIdentifier() { return this.identifier; }


}
