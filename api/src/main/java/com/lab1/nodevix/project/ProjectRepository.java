package com.lab1.nodevix.project;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    @Query("SELECT COUNT(p) > 0 FROM Project p JOIN p.users u WHERE p.id = :projectId AND u.id = :userId")
    boolean isUserOwner(@Param("projectId") Long projectId, @Param("userId") Long userId);

}
