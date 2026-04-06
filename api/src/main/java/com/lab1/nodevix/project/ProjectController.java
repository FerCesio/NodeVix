package com.lab1.nodevix.project;


import com.lab1.nodevix.project.dtos.*;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/manage")
public class ProjectController {
    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping("/home")
    public CreateResponse createProject(@RequestBody CreateProject cp){
        return projectService.create(cp);
    }

    @PutMapping("/{id}")
    public UpdateResponse updateProject(@RequestBody UpdateProject up, @PathVariable Long id){
        return projectService.update(id, up);
    }

    @DeleteMapping("/{id}")
    public DeleteResponse delete(@PathVariable Long id) {
        return projectService.delete(id);
    }
}
