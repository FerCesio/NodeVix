package com.lab1.nodevix.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> { // Ya viene con metodos predefinidos

    Optional<User> findByEmail(String email);

    Optional<User> findByName(String name);

    Optional<User> findByNameOrEmail(String name, String email);

    @Query("SELECT COUNT(u) > 0 FROM User u JOIN u.collaborations c WHERE u.id = :userId AND c.project.id = :projectId")
    boolean hasProject(@Param("userId") Long userId, @Param("projectId") Long projectId);

    @Query("SELECT u FROM User u JOIN u.collaborations c WHERE c.project.id = :projectId")
    Optional<User> findByProjectId(@Param("projectId") Long projectId);
}
