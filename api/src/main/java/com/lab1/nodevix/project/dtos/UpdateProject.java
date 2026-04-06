package com.lab1.nodevix.project.dtos;

import com.lab1.nodevix.project.ProjectContent;

public class UpdateProject {
    String name;
    String description;
    ProjectContent content; // Ver si tiene que ser string o json

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

    public ProjectContent getContent() {
        return content;
    }


}
