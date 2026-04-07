package com.lab1.nodevix;


import com.lab1.nodevix.user.UserService;
import com.lab1.nodevix.user.dtos.LoginResponse;
import com.lab1.nodevix.user.dtos.RegisterResponse;
import com.lab1.nodevix.user.dtos.UserLogin;
import com.lab1.nodevix.user.dtos.UserRegister;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public RegisterResponse registerUser(@RequestBody UserRegister ur) {
        return userService.register(ur);
    }

    @PostMapping("/login")
    public LoginResponse loginUser(@RequestBody UserLogin ul) {
        return userService.login(ul);
    }
}
