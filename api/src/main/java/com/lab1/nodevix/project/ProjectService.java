package com.lab1.nodevix.project;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import com.lab1.nodevix.has.Has;
import com.lab1.nodevix.has.HasRepository;
import com.lab1.nodevix.project.dtos.*;
import com.lab1.nodevix.user.User;
import com.lab1.nodevix.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class ProjectService {
    private final ProjectRepository projectRepo;
    private final HasRepository hasRepo;
    private final UserRepository userRepo;

    public ProjectService(ProjectRepository projectRepo, HasRepository hasRepo, UserRepository userRepo) {
        this.projectRepo = projectRepo;
        this.hasRepo = hasRepo;
        this.userRepo = userRepo;
    }

    @Transactional
    public CreateResponse create(CreateProject cp, Long userID) {
        User user = userRepo.findById(userID).orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        Project project = new  Project(cp.getProjectName());
        Project saved = projectRepo.save(project);
        hasRepo.save(new Has(user, saved));

        CreateResponse pr = new CreateResponse(saved.getId(),saved.getName(),saved.getDescription());

        if (saved.getCreatedOn() != null) {
            String parsedCreate = saved.getCreatedOn().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            pr.setCreatedOn(parsedCreate);
        }
        if (saved.getModifiedOn() != null) {
            String parsedModified = saved.getModifiedOn().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            pr.setUpdatedOn(parsedModified);
        }

        return pr;
    }

    @Transactional
    public UpdateResponse update(Long projectID, Long userID, UpdateProject up){
        Project project = projectRepo.findById(projectID).orElseThrow(() -> new RuntimeException("No existe el proyecto"));

        if (!hasRepo.existsByProjectIdAndUserId(projectID, userID)) {throw new RuntimeException("No existe el proyecto");}

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

        project.setName(up.getName());
        project.setDescription(up.getDescription());
        if (up.getContent() != null) project.setContent(up.getContent());

        Project saved = projectRepo.saveAndFlush(project);

        return new UpdateResponse(saved.getId(),saved.getName(),saved.getDescription(),saved.getContent(),saved.getModifiedOn().format(formatter));
    }

    public DeleteResponse delete(Long projectID, Long userID){
        if (!projectRepo.existsById(projectID)) {
            throw new EntityNotFoundException("No existe el proyecto con id: " + projectID);
        }

        if (!hasRepo.existsByProjectIdAndUserId(projectID, userID)) { throw new RuntimeException("No tienes permiso");}
        hasRepo.deleteByProjectId(projectID);
        projectRepo.deleteById(projectID);
        return new DeleteResponse("Proyecto con id: " + projectID + " eliminado");
    }

    public List<ReadListResponse> readList(Long userID){
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
        List<Has> relations = hasRepo.findProjectsByUserId(userID);

        return hasRepo.findProjectsByUserId(userID).stream()
                .map(has -> has.getProject())
                .map(p -> new ReadListResponse(
                        p.getId(),
                        p.getName(),
                        p.getDescription(),
                        p.getModifiedOn() != null ? p.getModifiedOn().format(formatter) : "S/F",
                        p.getCreatedOn() != null ? p.getCreatedOn().format(formatter) : "S/F"
                ))
                .collect(Collectors.toList());

    }

}
