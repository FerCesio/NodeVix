package com.lab1.nodevix.comments;

import com.lab1.nodevix.comments.dtos.MessageRequest;
import com.lab1.nodevix.comments.dtos.UpdateResponse;
import com.lab1.nodevix.post.Post;
import com.lab1.nodevix.post.PostRepository;
import com.lab1.nodevix.security.JWTService;
import com.lab1.nodevix.user.User;
import com.lab1.nodevix.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestHeader;

import java.nio.file.AccessDeniedException;
import java.time.format.DateTimeFormatter;

@Service
public class CommentService {
    private final CommentRepository commentRepo;
    private final PostRepository postRepo;
    private final UserRepository userRepo;

    public CommentService(CommentRepository commentRepo, PostRepository postRepo, UserRepository userRepo) {
        this.commentRepo = commentRepo;
        this.postRepo = postRepo;
        this.userRepo = userRepo;
    }

    @Transactional
    public void create(Long postId, Long userId, MessageRequest mr){
        Post post = postRepo.findById(postId).orElseThrow();
        User user = userRepo.findById(userId).orElseThrow();

        Comment comment = new Comment();
        comment.setPost(post);
        comment.setUser(user);
        comment.setMessage(mr.getMessage());

        commentRepo.save(comment);
    }

    @Transactional
    public UpdateResponse update(Long userId, Long commentId, MessageRequest mr){
        Comment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comentario no encontrado"));
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

        if (!comment.getUser().getId().equals(userId)) {
            throw new RuntimeException("No tiene permiso para editar el comentario");
        }

        comment.setMessage(mr.getMessage());
        Comment saved = commentRepo.save(comment);

        return new UpdateResponse(saved.getMessage(), formatter.format(saved.getModifiedOn()));
    }

    @Transactional
    public void delete(Long commentId, Long userId) {
        Comment comment = commentRepo.findById(commentId).orElseThrow(() -> new EntityNotFoundException("Comentario no encontrado"));
        if (!comment.getUser().getId().equals(userId)) {
            throw new RuntimeException("No tiene permiso para borrar el comentario");
        }
        commentRepo.delete(comment);
    }

}
