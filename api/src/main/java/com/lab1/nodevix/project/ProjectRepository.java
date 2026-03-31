package com.lab1.nodevix.project;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findByDate(String email);

    Optional<Project> findByName(String name);

    Optional<List<Project>> findByUser(String user_name);
}
