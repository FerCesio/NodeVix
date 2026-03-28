package com.lab1.nodevix.user;

import com.lab1.nodevix.user.dtos.LoginResponse;
import com.lab1.nodevix.user.dtos.RegisterResponse;
import com.lab1.nodevix.user.dtos.UserLogin;
import com.lab1.nodevix.user.dtos.UserRegister;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class UserService {
    private final UserRepository userRepo;

    public UserService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    public RegisterResponse register(UserRegister ur) {

        // validar si existe
        userRepo.findByEmail(ur.getEmail()).ifPresent(u -> {
            throw new RuntimeException("Email ya registrado");
        });
        userRepo.findByName(ur.getUserName()).ifPresent(u -> {
            throw new RuntimeException("Usuario ya registrado");
        });

        LocalDate parsed = LocalDate.parse(ur.getBirthDate());

        // crear usuario
        User user = new User(
                ur.getUserName(),
                ur.getEmail(),
                ur.getPassword(),
                parsed);

        User saved = userRepo.save(user);

        return new RegisterResponse(
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getBirthDate().toString());

    }

    public LoginResponse login(UserLogin ul) {

        String identifier = ul.getIdentifier();
        User user = userRepo.findByNameOrEmail(identifier, identifier)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // validar password (simple)
        if (!user.getPassword().equals(ul.getPassword())) {
            throw new RuntimeException("Contraseña incorrecta");
        }

        return new LoginResponse(user.getId(), user.getEmail());
    }

}
