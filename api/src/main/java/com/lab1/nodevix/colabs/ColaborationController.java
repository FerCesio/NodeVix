package com.lab1.nodevix.colabs;

import com.lab1.nodevix.colabs.dto.AddCollaboratorRequest;
import com.lab1.nodevix.colabs.dto.CollaboratorDTO;
import com.lab1.nodevix.security.JWTService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ColaborationController {
    private final ColaborationService collaborationService;
    private final JWTService jwtService;


    public ColaborationController(ColaborationService collaborationService, JWTService jwtService) {
        this.collaborationService = collaborationService;
        this.jwtService = jwtService;
    }

    @PostMapping("/{projectId}/accept-invitation")
    public ResponseEntity<Void> acceptInvitation(@PathVariable Long projectId, @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long userId = jwtService.extractUserId(token);

        collaborationService.registerGuest(projectId, userId);

        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{projectId}/collaborators/{userId}/role")
    public ResponseEntity<Void> updateRole(
            @PathVariable Long projectId,
            @PathVariable Long userId,
            @RequestParam Role role,
            @RequestHeader("Authorization") String authHeader) {
        System.out.println("LLEGO UNA REQUEST");

        String token = authHeader.substring(7);
        Long requesterId = jwtService.extractUserId(token);
        collaborationService.updateCollaboratorRole(projectId, userId, requesterId, role);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{projectId}/collaborators")
    public ResponseEntity<List<CollaboratorDTO>> getCollaborators(@PathVariable Long projectId, @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long requesterId = jwtService.extractUserId(token);

        List<CollaboratorDTO> collaborators = collaborationService.getCollaborators(projectId, requesterId);
        return ResponseEntity.ok(collaborators);
    }

    @PostMapping("/{projectId}/collaborators")
    public ResponseEntity<Void> addCollaborator(
            @PathVariable Long projectId,
            @RequestBody AddCollaboratorRequest request, // Un DTO con el email o userId
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        Long requesterId = jwtService.extractUserId(token);

        collaborationService.addCollaborator(projectId, requesterId, request.getUsername());

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{projectId}/collaborators/{userId}")
    public ResponseEntity<Void> removeCollaborator(
            @PathVariable Long projectId,
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        Long requesterId = jwtService.extractUserId(token);

        collaborationService.removeCollaborator(projectId, userId, requesterId);

        return ResponseEntity.noContent().build();
    }

}
