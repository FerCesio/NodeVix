package com.lab1.nodevix.colabs;

import com.lab1.nodevix.project.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ColaborationRepository extends JpaRepository<Colaboration, Long> {

    boolean existsByProjectIdAndUserId(Long projectId, Long userId);
    List<Colaboration> findByUserId(Long userId);
    List<Colaboration> findByProjectId(Long projectId);

    Optional<Colaboration> findByProjectIdAndUserId(Long projectId, Long userId);
    @Query("SELECT pc.project FROM Colaboration pc WHERE pc.user.id = :userId")
    List<Project> findProjectsByUserId(@Param("userId") Long userId);
}
