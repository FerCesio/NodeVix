package com.lab1.nodevix.project;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

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

    public ProjectService(ProjectRepository projectRepo, UserRepository userRepo) {
        this.projectRepo = projectRepo;
        this.userRepo = userRepo;
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

        // Nota: No hace falta guardar el 'user' explícitamente si tienes
        // CascadeType.PERSIST
        // pero guardar el proyecto es lo que nos da los datos para la respuesta.

        // 5. Mapeo de la respuesta
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
        // 1. Buscamos el proyecto
        Project project = projectRepo.findById(projectID)
                .orElseThrow(() -> new RuntimeException("No existe el proyecto"));

        // 2. Verificación de propiedad (Sustituye al hasRepo)
        // Buscamos si el usuario está en la lista de propietarios del proyecto
        // Nota: Esto requiere que en Project.java tengas la lista 'users' o 'owners'
        if (!userRepo.hasProject(userID, projectID)) {
            throw new RuntimeException("Acceso denegado");
        }

        // 3. Actualización de datos
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

        project.setName(up.getName());
        project.setDescription(up.getDescription());
        if (up.getContent() != null) {
            project.setContent(up.getContent());
        }

        // saveAndFlush asegura que los cambios se envíen a la DB inmediatamente
        Project saved = projectRepo.saveAndFlush(project);

        return new UpdateResponse(
                saved.getId(),
                saved.getName(),
                saved.getDescription(),
                saved.getContent(),
                saved.getModifiedOn().format(formatter));
    }

    @Transactional
    public DeleteResponse delete(Long projectID, Long userID) {
        // 1. Verificación rápida de propiedad usando el nuevo método del repositorio
        if (!userRepo.hasProject(userID, projectID)) {
            throw new RuntimeException("No tienes permiso o el proyecto no existe");
        }

        // 2. Buscamos las entidades para operar sobre ellas
        User user = userRepo.findById(userID)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        Project project = projectRepo.findById(projectID)
                .orElseThrow(() -> new EntityNotFoundException("Proyecto no encontrado"));

        // 3. Rompemos la relación en la tabla intermedia 'has'
        // Al removerlo de la lista, JPA genera el DELETE en la tabla de unión al hacer
        // flush/commit
        user.getProjects().remove(project);
        userRepo.save(user);

        // 4. Borramos el proyecto físicamente de su tabla
        projectRepo.delete(project);

        return new DeleteResponse("Proyecto con id: " + projectID + " eliminado correctamente");
    }

    @Transactional(readOnly = true)
    public List<ReadListResponse> readList(Long userID) {
        // 1. Buscamos al usuario
        User user = userRepo.findById(userID)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        // 2. Definimos el formato de fecha
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

        // 3. Obtenemos los proyectos directamente desde el objeto User
        // user.getProjects() ya tiene la lista gracias al @ManyToMany
        return user.getProjects().stream()
                .map(p -> new ReadListResponse(
                        p.getId(),
                        p.getName(),
                        p.getDescription(),
                        p.getModifiedOn() != null ? p.getModifiedOn().format(formatter) : "S/F",
                        p.getCreatedOn() != null ? p.getCreatedOn().format(formatter) : "S/F"))
                .collect(Collectors.toList());
    }
}
