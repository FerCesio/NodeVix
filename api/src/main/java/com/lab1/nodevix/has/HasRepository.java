package com.lab1.nodevix.has;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HasRepository extends JpaRepository<Has, Long> {
    List<Has> findByUserId(Long userId);
    void deleteByProjectId(Long projectId);
    boolean existsByProjectIdAndUserId(Long projectId, Long userId);

    @Query("SELECT h FROM Has h JOIN FETCH h.project WHERE h.user.id = :userId")
    List<Has> findProjectsByUserId(@Param("userId") Long userID);
}
