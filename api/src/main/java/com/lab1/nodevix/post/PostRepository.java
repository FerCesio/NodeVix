package com.lab1.nodevix.post;

import com.lab1.nodevix.project.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    @Query("SELECT p FROM Post p JOIN FETCH p.project")
    List<Post> findAllWithProject();

    List<Post> findByProjectIn(List<Project> projects);
}
