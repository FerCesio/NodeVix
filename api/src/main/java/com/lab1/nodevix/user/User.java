package com.lab1.nodevix.user;

import com.lab1.nodevix.colabs.Colaboration;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import com.lab1.nodevix.project.Project;

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

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Colaboration> collaborations = new ArrayList<>();

    public User() {
    }

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

    public List<Project> getProjects() {
        List<Project> projectList = new ArrayList<>();
        for (Colaboration colab : collaborations) {
            projectList.add(colab.getProject());
        }
        return projectList;
    }

    public String getAvatar() {
        return avatar_url;
    }

}
