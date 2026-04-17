package com.lab1.nodevix.postInteraction;

import com.lab1.nodevix.post.Post;
import com.lab1.nodevix.user.User;
import jakarta.persistence.*;

@Entity
public class PostInteraction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "post_id")
    private Post post;

    // true para like, false para dislike
    private boolean isLike;

    public PostInteraction(User user, Post post, boolean isLike) {
        this.user = user;
        this.post = post;
        this.isLike = isLike;
    }

    public PostInteraction() {
    }

    public boolean isLike() {
        return isLike;
    }

    public void setLike(boolean like) {
        isLike = like;
    }

}
