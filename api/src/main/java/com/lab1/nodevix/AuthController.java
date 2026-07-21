package com.lab1.nodevix;


import com.lab1.nodevix.user.UserService;
import com.lab1.nodevix.user.dtos.LoginResponse;
import com.lab1.nodevix.user.dtos.RegisterResponse;
import com.lab1.nodevix.user.dtos.UserLogin;
import com.lab1.nodevix.user.dtos.UserRegister;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> registerUser(@RequestBody UserRegister ur) {
        return ResponseEntity.status(201).body(userService.register(ur));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> loginUser(@RequestBody UserLogin ul) {
        return ResponseEntity.status(201).body(userService.login(ul));
    }

    
}
