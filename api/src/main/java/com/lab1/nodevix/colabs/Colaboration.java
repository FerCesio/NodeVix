package com.lab1.nodevix.colabs;

import com.lab1.nodevix.project.Project;
import com.lab1.nodevix.user.User;
import jakarta.persistence.*;

@Entity
@Table(name = "has")
public class Colaboration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "rol", nullable = false)
    private Role role;

    public Colaboration(User user, Project project, Role role) {
        this.user = user;
        this.project = project;
        this.role = role;
    }

    public User getUser() {
        return user;
    }

    public Project getProject() {
        return project;
    }

    public Role getRole() {
        return role;
    }

    public Colaboration() {}

    public void setRole(Role newRole) {
        this.role = newRole;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
