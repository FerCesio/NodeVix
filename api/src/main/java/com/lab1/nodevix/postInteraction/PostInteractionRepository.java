package com.lab1.nodevix.postInteraction;

import com.lab1.nodevix.post.Post;
import com.lab1.nodevix.user.User;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PostInteractionRepository extends JpaRepository<PostInteraction, Long> {
    Optional<PostInteraction> findByPostAndUser(Post post, User user);

    @Modifying
    @Transactional
    @Query("DELETE FROM PostInteraction pi WHERE pi.post.id = :postId")
    void deleteByPostId(Long postId);
}
