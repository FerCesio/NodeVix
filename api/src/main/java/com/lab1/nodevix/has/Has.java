package com.lab1.nodevix.has;

import com.lab1.nodevix.project.Project;
import com.lab1.nodevix.user.User;
import jakarta.persistence.*;

@Table(name = "has")
@Entity
public class Has {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    public Has() {}

    public Has(User user, Project project) {
        this.user = user;
        this.project = project;
    }

    public long getId() { return id; }
    public User getUser() { return user; }
    public Project getProject() { return project; }
}