package com.lab1.nodevix.project;

import org.springframework.stereotype.Service;

@Service
public class ProjectService {
    private final ProjectRepository projectRepo;

    public ProjectService(ProjectRepository projectRepo) {
        this.projectRepo = projectRepo;
    }

}
