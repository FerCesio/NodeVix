package com.lab1.nodevix.project;


import jakarta.persistence.*;
import org.springframework.boot.jackson.autoconfigure.JacksonProperties;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.security.Timestamp;
import java.time.LocalDateTime;

@Table(name = "project")
@Entity
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false, unique = true)
    private String name;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdOn;

    @LastModifiedDate
    private LocalDateTime modifiedOn;

    private String content; // cambiar por JSON despues
    private String description;


    public Project() {}

    public Project(String name, String description){
        this.name = name;
        this.description = description;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public long getId() { return id; }

    public LocalDateTime getCreatedOn() { return createdOn; }

    public LocalDateTime getModifiedOn() { return modifiedOn; }
}
