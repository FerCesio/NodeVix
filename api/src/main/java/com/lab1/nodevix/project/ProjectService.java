package com.lab1.nodevix.project;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import com.lab1.nodevix.colabs.Colaboration;
import com.lab1.nodevix.colabs.ColaborationRepository;
import com.lab1.nodevix.colabs.Role;
import com.lab1.nodevix.post.PostRepository;
import com.lab1.nodevix.project.dtos.*;
import com.lab1.nodevix.user.User;
import com.lab1.nodevix.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProjectService {
    private final ProjectRepository projectRepo;
    private final UserRepository userRepo;
    private final PostRepository postRepo;
    private final ColaborationRepository colaborationRepo;

    public ProjectService(ProjectRepository projectRepo, UserRepository userRepo, PostRepository postRepo, ColaborationRepository colaborationRepo) {
        this.projectRepo = projectRepo;
        this.userRepo = userRepo;
        this.postRepo = postRepo;
        this.colaborationRepo = colaborationRepo;
    }

    @Transactional
    public CreateResponse create(CreateProject cp, Long userID) {
        User user = userRepo.findById(userID)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        Project project = new Project(cp.getProjectName(), cp.getContent());

        user.getProjects().add(project);

        Project saved = projectRepo.save(project);

        Colaboration ownerMapping = new Colaboration(user, saved, Role.OWNER);
        colaborationRepo.save(ownerMapping);

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
        Colaboration colab = colaborationRepo.findByProjectIdAndUserId(projectID, userID)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a este proyecto"));

        if (colab.getRole() == Role.GUEST) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Modo lectura: no tienes permisos para guardar cambios.");
        }

        Project project = projectRepo.findById(projectID)
                .orElseThrow(() -> new RuntimeException("No existe el proyecto"));

        if (!userRepo.hasProject(userID, projectID)) {
            throw new RuntimeException("Acceso denegado");
        }

        project.setName(up.getName());
        project.setDescription(up.getDescription());

        if (up.getContent() != null && !up.getContent().isBlank()) {
            project.setContent(up.getContent());
        }

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
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

        // Buscamos las colaboraciones directamente.
        // Así tenemos el Proyecto Y el Rol al mismo tiempo.
        List<Colaboration> colaborations = colaborationRepo.findByUserId(userID);

        return colaborations.stream()
                .map(c -> {
                    Project p = c.getProject();
                    return new GetProjectResponse(
                            p.getId(),
                            p.getName(),
                            p.getDescription(),
                            p.getModifiedOn() != null ? p.getModifiedOn().format(formatter) : "S/F",
                            p.getCreatedOn() != null ? p.getCreatedOn().format(formatter) : "S/F",
                            c.getRole().name() // <-- ACÁ LE PASAMOS EL ROL AL FRONTEND
                    );
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GetProjectResponse get(Long projectID, Long userID) {
        // 1 y 2. Buscar colaboración y validar acceso en un solo paso
        Colaboration colab = colaborationRepo.findByProjectIdAndUserId(projectID, userID)
                .orElseThrow(() -> new RuntimeException("Acceso denegado o proyecto inexistente"));

        Project project = colab.getProject();

        // 3. Retornar inyectando el rol
        return new GetProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getModifiedOn().toString(),
                project.getCreatedOn().toString(),
                colab.getRole().name()
        );
    }

    @Transactional(readOnly = true)
    public UsableGetResponse getContent(Long projectID, Long userID) {
        // 1. Buscar entidad
        Project project = projectRepo.findById(projectID)
                .orElseThrow(() -> new EntityNotFoundException("Proyecto no encontrado"));

        Colaboration colab = colaborationRepo.findByProjectIdAndUserId(projectID, userID)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado o proyecto inexistente"));

        // 2. Validar propiedad
        if (!userRepo.hasProject(userID, projectID)) {
            throw new RuntimeException("Acceso denegado");
        }

        return new UsableGetResponse(
                project.getId(),
                project.getName(),
                project.getContent(),
                colab.getRole().name()
        );

    }

}
