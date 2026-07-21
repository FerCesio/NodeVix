package com.lab1.nodevix.colabs;

import com.lab1.nodevix.colabs.dto.CollaboratorDTO;
import com.lab1.nodevix.project.Project;
import com.lab1.nodevix.project.ProjectRepository;
import com.lab1.nodevix.user.User;
import com.lab1.nodevix.user.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ColaborationService {
    private final ColaborationRepository collaboratorRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;


    public ColaborationService(ColaborationRepository collaboratorRepository,  ProjectRepository projectRepository, UserRepository userRepository) {
        this.collaboratorRepository = collaboratorRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void registerGuest(Long projectId, Long userId) {
        boolean alreadyExists = collaboratorRepository.existsByProjectIdAndUserId(projectId, userId);

        if (alreadyExists) {
            return;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Proyecto no encontrado"));

        Colaboration colaboration = new Colaboration(user, project, Role.GUEST);
        collaboratorRepository.save(colaboration);
    }

    @Transactional
    public void updateCollaboratorRole(Long projectId, Long targetUserId, Long requesterUserId, Role newRole) {
        System.out.println("LLEGO UNA REQUEST");
        Colaboration requesterColab = collaboratorRepository.findByProjectIdAndUserId(projectId, requesterUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No perteneces a este proyecto"));

        if (requesterColab.getRole() != Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el dueño puede modificar roles");
        }

        if (requesterUserId.equals(targetUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes alterar tu propio rol de propietario");
        }

        Colaboration targetColab = collaboratorRepository.findByProjectIdAndUserId(projectId, targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El colaborador no existe en este proyecto"));

        targetColab.setRole(newRole);
        collaboratorRepository.save(targetColab);
    }

    public List<CollaboratorDTO> getCollaborators(Long projectId, Long userId){
        Colaboration requesterColab = collaboratorRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new RuntimeException(""));

        if (requesterColab.getRole() != Role.OWNER) {
            throw new RuntimeException("");
        }

        List<Colaboration> colaborations = collaboratorRepository.findByProjectId(projectId);

        return colaborations.stream().map(colab -> {
            User user = colab.getUser();
            return new CollaboratorDTO(
                    user.getId(),
                    user.getName(),
                    colab.getRole().name()
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    public void addCollaborator(Long projectId, Long requesterUserId, String username) {
        // 1. Verificamos que el que hace la petición sea el OWNER
        Colaboration requesterColab = collaboratorRepository.findByProjectIdAndUserId(projectId, requesterUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No perteneces a este proyecto"));

        if (requesterColab.getRole() != Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el dueño puede agregar colaboradores");
        }

        // 2. Buscamos al usuario por su username
        User targetUser = userRepository.findByName(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario con ese username no existe"));

        // 3. Verificamos que no sea ya colaborador
        boolean alreadyExists = collaboratorRepository.existsByProjectIdAndUserId(projectId, targetUser.getId());
        if (alreadyExists) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El usuario ya es colaborador de este proyecto");
        }

        // 4. Creamos la colaboración (por defecto con rol GUEST o el que prefieras)
        Colaboration newColab = new Colaboration();
        newColab.setProject(projectRepository.findById(projectId).get());
        newColab.setUser(targetUser);
        newColab.setRole(Role.GUEST);

        collaboratorRepository.save(newColab);
    }

    @Transactional
    public void removeCollaborator(Long projectId, Long targetUserId, Long requesterUserId) {
        // 1. Verificamos que el que ejecuta sea el OWNER
        Colaboration requesterColab = collaboratorRepository.findByProjectIdAndUserId(projectId, requesterUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No perteneces a este proyecto"));

        if (requesterColab.getRole() != Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el dueño puede eliminar colaboradores");
        }

        // 2. Evitamos que el owner se borre a sí mismo por accidente
        if (requesterUserId.equals(targetUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes eliminarte a ti mismo del proyecto");
        }

        // 3. Buscamos la colaboración y la eliminamos
        Colaboration targetColab = collaboratorRepository.findByProjectIdAndUserId(projectId, targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El colaborador no existe en este proyecto"));

        collaboratorRepository.delete(targetColab);
    }
}
