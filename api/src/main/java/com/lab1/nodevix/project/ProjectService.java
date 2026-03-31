package com.lab1.nodevix.project;

import java.time.LocalDate;

import org.springframework.stereotype.Service;

import com.lab1.nodevix.project.dtos.CreateProject;
import com.lab1.nodevix.project.dtos.ProjectResponse;
import com.lab1.nodevix.user.User;
import com.lab1.nodevix.user.dtos.RegisterResponse;
import com.lab1.nodevix.user.dtos.UserRegister;

@Service
public class ProjectService {
    private final ProjectRepository projectRepo;

    public ProjectService(ProjectRepository projectRepo) {
        this.projectRepo = projectRepo;
    }

    /**
     * Metodo para guardar un projecto de un user en la db
     * 
     * @param ur
     * @param cp
     * @return
     */
    public ProjectResponse save(User ur, CreateProject cp) {

        return null;
    }

    /**
     * 
     * @return
     */
    public ProjectResponse create() {
        return null;
    }

}
