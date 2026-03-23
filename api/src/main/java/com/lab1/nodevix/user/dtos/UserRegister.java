package com.lab1.nodevix.user.dtos;

import java.util.Date;

public class UserRegister {
    private String email;
    private String password;
    private String userName;
    private Date birthDate;

   public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setUserName(String userName) { this.userName = userName; }
    public void setBirthDate(Date birthDate) { this.birthDate = birthDate; }

    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getUserName() { return userName; }
    public Date getBirthDate() { return birthDate; }
}
