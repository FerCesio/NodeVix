package com.lab1.nodevix.post.dtos;

public class CloneRequest {
    private String name;
    private String content;

    public CloneRequest(){}

    public String getName() {
        return name;
    }

    public String getContent() {
        return content;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setContent(String content) {
        this.content = content;
    }


}
