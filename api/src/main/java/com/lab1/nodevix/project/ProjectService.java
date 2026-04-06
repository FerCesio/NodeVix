package com.lab1.nodevix.project;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import com.lab1.nodevix.project.dtos.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class ProjectService {
    private final ProjectRepository projectRepo;

    public ProjectService(ProjectRepository projectRepo) {
        this.projectRepo = projectRepo;
    }

    public CreateResponse create(CreateProject cp) {

        Project project = new  Project(cp.getProjectName(),cp.getDescription());
        Project saved = projectRepo.save(project);

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
    public UpdateResponse update(Long id, UpdateProject up){
        Project project = projectRepo.findById(id).orElseThrow(() -> new RuntimeException("No existe el proyecto"));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

        project.setName(up.getName());
        project.setDescription(up.getDescription());
        if (up.getContent() != null) project.setContent(up.getContent());

        Project saved = projectRepo.saveAndFlush(project);

        return new UpdateResponse(saved.getId(),saved.getName(),saved.getDescription(),saved.getContent(),saved.getModifiedOn().format(formatter));
    }

    public DeleteResponse delete(Long id){
        if (!projectRepo.existsById(id)) {
            throw new EntityNotFoundException("No existe el proyecto con id: " + id);
        }
        projectRepo.deleteById(id);
        return new DeleteResponse("Proyecto con id: " + id + " eliminado");
    }

    public List<ReadListResponse> readList(){
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

        return projectRepo.findAll().stream()
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
