package com.lab1.nodevix.user;

import com.lab1.nodevix.user.dtos.LoginResponse;
import com.lab1.nodevix.user.dtos.RegisterResponse;
import com.lab1.nodevix.user.dtos.UserLogin;
import com.lab1.nodevix.user.dtos.UserRegister;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
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
