package com.lab1.nodevix.user;

import com.lab1.nodevix.security.JWTService;
import com.lab1.nodevix.user.dtos.*;
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
    public UpdateResponse update(@RequestHeader("Authorization") String authHeader, @RequestBody UpdateRequest upd) {

        String token = authHeader.substring(7);
        Long id = jwtService.extractUserId(token);
        return userService.update(id, upd);
    }

}
