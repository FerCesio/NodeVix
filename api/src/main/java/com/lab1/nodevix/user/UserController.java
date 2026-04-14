package com.lab1.nodevix.user;

import com.lab1.nodevix.security.JWTService;
import com.lab1.nodevix.user.dtos.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    private final JWTService jwtService;

    public UserController(UserService userService, JWTService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PutMapping
    public ResponseEntity<UpdateResponse> update(@RequestHeader("Authorization") String authHeader, @RequestBody UpdateRequest upd) {
        String token = authHeader.substring(7);
        Long id = jwtService.extractUserId(token);
        return ResponseEntity.ok(userService.update(id, upd));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMyAccount(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        String token = authHeader.substring(7);
        Long id = jwtService.extractUserId(token);

        userService.delete(id);

        return ResponseEntity.noContent().build();
    }

}
