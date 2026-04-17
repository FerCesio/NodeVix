package com.lab1.nodevix.project;

import com.lab1.nodevix.project.dtos.*;
import com.lab1.nodevix.security.JWTService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
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
    public ResponseEntity<CreateResponse> createProject(@RequestBody CreateProject cp,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long id = jwtService.extractUserId(token);
        return ResponseEntity.status(201).body(projectService.create(cp, id));
    }

    @PutMapping("/{projectID}")
    public ResponseEntity<UpdateResponse> updateProject(@PathVariable Long projectID, @RequestBody UpdateProject up,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long userID = jwtService.extractUserId(token);
        return ResponseEntity.ok(projectService.update(projectID, userID, up));
    }

    @DeleteMapping("/{projectID}")
    public ResponseEntity<DeleteResponse> delete(@PathVariable Long projectID,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long userID = jwtService.extractUserId(token);
        return ResponseEntity.ok(projectService.delete(projectID, userID));
    }

    @GetMapping()
    public ResponseEntity<List<ReadListResponse>> readProjects(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long id = jwtService.extractUserId(token);
        return ResponseEntity.ok(projectService.readList(id));
    }
}
