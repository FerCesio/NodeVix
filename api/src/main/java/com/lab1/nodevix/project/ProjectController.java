package com.lab1.nodevix.project;


import com.lab1.nodevix.project.dtos.*;
import com.lab1.nodevix.security.JWTService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/manage")
public class ProjectController {
    private final ProjectService projectService;
    private final JWTService jwtService;

    public ProjectController(ProjectService projectService, JWTService jwtService) {
        this.projectService = projectService;
        this.jwtService = jwtService;
    }

    @PostMapping("/create")
    public CreateResponse createProject(@RequestBody CreateProject cp, @RequestHeader("Authorization") String authHeader){
        String token = authHeader.substring(7);
        Long id = jwtService.extractUserId(token);
        return projectService.create(cp, id);
    }

    @PutMapping("/{projectID}")
    public UpdateResponse updateProject(@PathVariable Long projectID, @RequestBody UpdateProject up, @RequestHeader("Authorization") String authHeader){
        String token = authHeader.substring(7);
        Long userID = jwtService.extractUserId(token);
        return projectService.update(projectID, userID, up);
    }

    @DeleteMapping("/{projectID}")
    public DeleteResponse delete(@PathVariable Long projectID, @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long userID = jwtService.extractUserId(token);
        return projectService.delete(projectID, userID);
    }

    @GetMapping()
    public List<ReadListResponse> readProjects(@RequestHeader("Authorization") String authHeader){
        String token = authHeader.substring(7);
        Long id = jwtService.extractUserId(token);
        return projectService.readList(id);
    }
}
