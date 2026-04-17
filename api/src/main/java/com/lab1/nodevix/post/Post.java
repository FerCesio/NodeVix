package com.lab1.nodevix.post;

import com.lab1.nodevix.project.Project;
import jakarta.persistence.*;

@Entity
@Table(name = "post")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int views;

    private int likes;

    private int dislikes;

    @OneToOne
    @JoinColumn(name = "project_id", unique = true)
    private Project project;

    public Post(){
        this.views = 0;
        this.likes = 0;
        this.dislikes = 0;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setViews(int views) {
        this.views = views;
    }

    public void setLikes(int likes) {
        this.likes = likes;
    }

    public void setDislikes(int dislikes) {
        this.dislikes = dislikes;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public Long getId() {
        return id;
    }

    public int getViews() {
        return views;
    }

    public int getLikes() {
        return likes;
    }

    public int getDislikes() {
        return dislikes;
    }

    public Project getProject() {
        return project;
    }
}
