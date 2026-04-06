package com.lab1.nodevix.user;

import com.lab1.nodevix.user.dtos.*;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/auth")
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

    @PutMapping("/{id}")
    public UpdateResponse update(@PathVariable Long id, @RequestBody UpdateRequest upd) {
        return userService.update(id, upd);
    }

}
