package com.lab1.nodevix.user;

import com.lab1.nodevix.project.ProjectRepository;
import com.lab1.nodevix.security.JWTService;
import com.lab1.nodevix.user.dtos.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class UserService {
    private final UserRepository userRepo;
    private final ProjectRepository projectRepo;

    private final JWTService jwtService;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepo, ProjectRepository projectRepo,
            JWTService jwtService,
            PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.projectRepo = projectRepo;

        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
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

        String encodedPassword = passwordEncoder.encode(ur.getPassword());

        // crear usuario
        User user = new User(
                ur.getUserName(),
                ur.getEmail(),
                encodedPassword,
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

        boolean matches = passwordEncoder.matches(ul.getPassword(), user.getPassword());

        if (!matches) {
            throw new RuntimeException("Contraseña incorrecta");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new LoginResponse(user.getId(), user.getEmail(), token);
    }

    @Transactional
    public UpdateResponse update(Long id, UpdateRequest request) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("No existe el usuario con id: " + id));

        // Solo actualiza el nombre si se envió uno válido
        if (request.getUserName() != null && !request.getUserName().isBlank()) {
            user.setName(request.getUserName());
        }

        // CLAVE: Solo encripta si el password NO es nulo ni está en blanco
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            String encodedPassword = passwordEncoder.encode(request.getPassword());
            user.setPassword(encodedPassword);
        }

        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            // Asegúrate que el método en la entidad sea setAvatarUrl si así se llama la columna
            user.setAvatar(request.getAvatarUrl()); 
        }

        // En JPA, gracias a @Transactional, el save no es estrictamente necesario 
        // al final de la transacción, pero saveAndFlush asegura la persistencia inmediata.
        User saved = userRepo.saveAndFlush(user);

        // Sugerencia: Incluye el avatar en la respuesta para actualizar el estado en React
        return new UpdateResponse(saved.getId(), saved.getName(), saved.getAvatar());
    }

    @Transactional
    public void delete(Long id) {
        if (!userRepo.existsById(id)) {
            throw new RuntimeException("Usuario no encontrado");
        }
        userRepo.deleteById(id);
    }

    public UserResponse getProfile(Long id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        
        // Retornamos el DTO con los datos necesarios para el form
        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getAvatar() // El string "avatar_x.png"
        );
    }
}
