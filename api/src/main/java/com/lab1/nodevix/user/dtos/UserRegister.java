package com.lab1.nodevix.user.dtos;

import java.time.LocalDate;
import java.util.Date;

public class UserRegister {
    private String email;
    private String password;
    private String userName;
    private String birthDate;

   public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setUserName(String userName) { this.userName = userName; }
    public void setBirthDate(String birthDate) { this.birthDate = birthDate; }

    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getUserName() { return userName; }
    public String getBirthDate() { return birthDate; }
}
