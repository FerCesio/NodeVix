package com.lab1.nodevix.user;

import com.lab1.nodevix.user.dtos.LoginResponse;
import com.lab1.nodevix.user.dtos.RegisterResponse;
import com.lab1.nodevix.user.dtos.UserLogin;
import com.lab1.nodevix.user.dtos.UserRegister;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    private final UserRepository userRepo;

    public UserService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    public RegisterResponse register(UserRegister ur){

        // validar si existe
        userRepo.findByEmail(ur.getEmail()).ifPresent(u -> {
            throw new RuntimeException("Email ya registrado");
        });

        // crear usuario
        User user = new User(
                ur.getUserName(),
                ur.getEmail(),
                ur.getPassword(),
                ur.getBirthDate()
        );

        User saved = userRepo.save(user);

        return new RegisterResponse(
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getBirthDate()
        );

    }

    public LoginResponse login(UserLogin ul){

        User user = userRepo.findByEmail(ul.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // validar password (simple)
        if (!user.getPassword().equals(ul.getPassword())) {
            throw new RuntimeException("Contraseña incorrecta");
        }

        return new LoginResponse(user.getId(), user.getEmail());
    }


}
