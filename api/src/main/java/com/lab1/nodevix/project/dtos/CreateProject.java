package com.lab1.nodevix.project.dtos;

public class CreateProject {
    private String projectName;
    private String content;

    public void setName(String projectName){
        this.projectName = projectName;
    }
    public  void setContent(String content){
        this.content = content;
    }

    public String getContent(){ return this.content; }
    public String getProjectName(){
        return this.projectName;
    }

}
