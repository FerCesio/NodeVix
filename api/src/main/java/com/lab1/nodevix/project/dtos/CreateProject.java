package com.lab1.nodevix.project.dtos;

public class CreateProject {
    private String projectName;
    private String description;

    public void setName(String projectName){
        this.projectName = projectName;
    }

    public void setDescription(String description){
        this.description = description;
    }

    public String getProjectName(){
        return this.projectName;
    }

    public String getDescription(){
        return this.description;
    }

}
