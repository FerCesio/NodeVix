package com.lab1.nodevix.user;

import com.lab1.nodevix.security.JWTService;
import com.lab1.nodevix.user.dtos.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class UserService {
    private final UserRepository userRepo;
    private final JWTService jwtService;

    public UserService(UserRepository userRepo, JWTService jwtService) {
        this.userRepo = userRepo;
        this.jwtService = jwtService;
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
        /**
         * 1. Hash the la password
         * 2. Generamos un JWT (token de auth) con la info de usuario
         * 3. Devolvemos el token al front para que almacene en su local storage
         */

        String identifier = ul.getIdentifier();
        User user = userRepo.findByNameOrEmail(identifier, identifier)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // validar password (simple)
        if (!user.getPassword().equals(ul.getPassword())) {
            throw new RuntimeException("Contraseña incorrecta");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new LoginResponse(user.getId(), user.getEmail(), token);
    }

    @Transactional
    public UpdateResponse update(Long id, UpdateRequest request) {
        System.out.println("ID recibido: " + id);
        System.out.println("userName recibido: " + request.getUserName());
        System.out.println("password recibida: " + request.getPassword());

        User user = userRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("No existe el usuario con id: " + id));

        if (request.getUserName() != null && !request.getUserName().isBlank()) {
            user.setName(request.getUserName());
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(request.getPassword());
        }

        User saved = userRepo.saveAndFlush(user);

        return new UpdateResponse(saved.getId(), saved.getName());
    }

}
