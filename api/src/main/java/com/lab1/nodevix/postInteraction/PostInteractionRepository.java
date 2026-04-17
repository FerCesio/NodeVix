package com.lab1.nodevix.postInteraction;

import com.lab1.nodevix.post.Post;
import com.lab1.nodevix.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostInteractionRepository extends JpaRepository<PostInteraction, Long> {
    Optional<PostInteraction> findByPostAndUser(Post post, User user);
}
