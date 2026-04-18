package com.lab1.nodevix.post.dtos;

public class PostListResponse {
    private Long id;
    private int likes;
    private int dislikes;
    private int views;
    private String projectName;
    private String projectDescription;
    private String author;

    public PostListResponse(Long id, int likes, int dislikes, int views, String  projectName, String projectDescription, String author) {
        this.id = id;
        this.likes = likes;
        this.dislikes = dislikes;
        this.views = views;
        this.projectName = projectName;
        this.projectDescription = projectDescription;
        this.author = author;
    }

    public Long getId(){
        return id;
    }

    public int getLikes() {
        return likes;
    }

    public int getDislikes() {
        return dislikes;
    }

    public int getViews() {
        return views;
    }

    public String getProjectName() {
        return projectName;
    }

    public String getProjectDescription() {
        return projectDescription;
    }

    public String getAuthor() {
        return author;
    }
}
