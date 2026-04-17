package com.lab1.nodevix.user;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.Date;

@Table(name = "users")
@Entity
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // id's generados por la base en orden ascendente
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    private String password;
    private LocalDate birthDate;
    private String avatar_url;

    public User(){}

    public User(String username, String email, String password, LocalDate birthDate) {
        this.email = email;
        this.password = password;
        this.birthDate = birthDate;
        this.name = username;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public void setAvatar(String avatar_url) {
        this.avatar_url = avatar_url;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public String getPassword() {
        return password;
    }

}
