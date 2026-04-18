package com.lab1.nodevix.project;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import com.lab1.nodevix.post.PostRepository;
import com.lab1.nodevix.project.dtos.*;
import com.lab1.nodevix.user.User;
import com.lab1.nodevix.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@Service
public class ProjectService {
    private final ProjectRepository projectRepo;
    private final UserRepository userRepo;
    private final PostRepository postRepo;

    public ProjectService(ProjectRepository projectRepo, UserRepository userRepo, PostRepository postRepo) {
        this.projectRepo = projectRepo;
        this.userRepo = userRepo;
        this.postRepo = postRepo;
    }

    @Transactional
    public CreateResponse create(CreateProject cp, Long userID) {
        // 1. Buscamos al usuario
        User user = userRepo.findById(userID)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        // 2. Creamos el proyecto
        Project project = new Project(cp.getProjectName());

        // 3. LA CLAVE: Establecemos la relación directamente en las entidades
        // Al añadir el proyecto a la lista del usuario, JPA sabe que debe insertar en
        // la tabla 'has'
        user.getProjects().add(project);

        // 4. Guardamos el proyecto (esto genera el ID y los timestamps)
        Project saved = projectRepo.save(project);

        CreateResponse pr = new CreateResponse(saved.getId(), saved.getName(), saved.getDescription());

        DateTimeFormatter isoFormatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

        if (saved.getCreatedOn() != null) {
            pr.setCreatedOn(saved.getCreatedOn().format(isoFormatter));
        }
        if (saved.getModifiedOn() != null) {
            pr.setUpdatedOn(saved.getModifiedOn().format(isoFormatter));
        }

        return pr;
    }

    @Transactional
    public UpdateResponse update(Long projectID, Long userID, UpdateProject up) {
        // 1. Verificación de seguridad y existencia
        Project project = projectRepo.findById(projectID)
                .orElseThrow(() -> new RuntimeException("No existe el proyecto"));

        if (!userRepo.hasProject(userID, projectID)) {
            throw new RuntimeException("Acceso denegado");
        }

        // 2. Actualización de metadatos básicos
        project.setName(up.getName());
        project.setDescription(up.getDescription());

        // 3. PIPELINE DE CONTENIDO (Opcional)
        // Si el 'content' en la request es null, el proyecto mantiene su JSON anterior
        if (up.getContent() != null) {
            project.setContent(up.getContent());
        }

        // 4. Persistencia
        Project saved = projectRepo.saveAndFlush(project);

        // 5. Formateo de respuesta
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

        return new UpdateResponse(
                saved.getId(),
                saved.getName(),
                saved.getDescription(),
                saved.getContent(), // Siempre devolvemos el estado final del JSON
                saved.getModifiedOn().format(formatter));
    }

    @Transactional
    public DeleteResponse delete(Long projectID, Long userID) {
        if (!userRepo.hasProject(userID, projectID)) {
            throw new RuntimeException("No tienes permiso o el proyecto no existe");
        }
        User user = userRepo.findById(userID)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        Project project = projectRepo.findById(projectID)
                .orElseThrow(() -> new EntityNotFoundException("Proyecto no encontrado"));

        if (postRepo.existsByProjectId(projectID)) {
            throw new IllegalStateException("El proyecto está publicado. Elimina el post primero.");
        }

        user.getProjects().remove(project);
        userRepo.save(user);

        projectRepo.delete(project);

        return new DeleteResponse("Proyecto con id: " + projectID + " eliminado correctamente");
    }

    @Transactional(readOnly = true)
    public List<GetProjectResponse> readList(Long userID) {
        // 1. Buscamos al usuario
        User user = userRepo.findById(userID)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        // 2. Definimos el formato de fecha
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

        // 3. Obtenemos los proyectos directamente desde el objeto User
        // user.getProjects() ya tiene la lista gracias al @ManyToMany
        return user.getProjects().stream()
                .map(p -> new GetProjectResponse(
                        p.getId(),
                        p.getName(),
                        p.getDescription(),
                        p.getModifiedOn() != null ? p.getModifiedOn().format(formatter) : "S/F",
                        p.getCreatedOn() != null ? p.getCreatedOn().format(formatter) : "S/F"))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GetProjectResponse get(Long projectID, Long userID) {
        // 1. Buscar entidad
        Project project = projectRepo.findById(projectID)
                .orElseThrow(() -> new EntityNotFoundException("Proyecto no encontrado"));

        // 2. Validar propiedad
        if (!userRepo.hasProject(userID, projectID)) {
            throw new RuntimeException("Acceso denegado");
        }

        // 3. Retornar usando el constructor específico
        return new GetProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getModifiedOn().toString(), // Convertimos fecha a String
                project.getCreatedOn().toString() // Convertimos fecha a String
        );
    }

}
