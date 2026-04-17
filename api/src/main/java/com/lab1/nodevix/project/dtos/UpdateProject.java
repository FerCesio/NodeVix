package com.lab1.nodevix.project.dtos;

public class UpdateProject {
    String name;
    String description;
    String content; // Ver si tiene que ser string o json

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getContent() {
        return content;
    }

}
