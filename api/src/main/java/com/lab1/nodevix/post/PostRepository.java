package com.lab1.nodevix.post;

import com.lab1.nodevix.project.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {
    @Query("SELECT p FROM Post p JOIN FETCH p.project")
    List<Post> findAllWithProject();

    List<Post> findByProjectIn(List<Project> projects);

    boolean existsByProjectId(Long projectId);

    @Query("SELECT p FROM Post p WHERE LOWER(p.project.name) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(p.project.description) LIKE LOWER(CONCAT('%', :term, '%'))")
    Page<Post> searchByTerm(@Param("term") String term, Pageable pageable);
}
