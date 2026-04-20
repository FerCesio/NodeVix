package com.lab1.nodevix.comments;

import com.lab1.nodevix.comments.dtos.CommentResponse;
import com.lab1.nodevix.comments.dtos.MessageRequest;
import com.lab1.nodevix.comments.dtos.UpdateResponse;
import com.lab1.nodevix.security.JWTService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@Controller
@RequestMapping("/api/comments")
public class CommentController {
    private final CommentService commentService;
    private final JWTService jwtService;


    public CommentController(CommentService commentService, JWTService jwtService ) {
        this.commentService = commentService;
        this.jwtService = jwtService;
    }


    private Long getUserIdFromHeader(String authHeader) {
        String token = authHeader.substring(7);
        return jwtService.extractUserId(token);
    }

    @PostMapping("/post/{postId}")
    public ResponseEntity<Void> create(
            @PathVariable Long postId,
            @RequestBody MessageRequest mr,
            @RequestHeader("Authorization") String authHeader) {

        Long userId = getUserIdFromHeader(authHeader);
        commentService.create(postId, userId, mr);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{commentId}")
    public ResponseEntity<UpdateResponse> update(
            @PathVariable Long commentId,
            @RequestBody MessageRequest mr,
            @RequestHeader("Authorization") String authHeader) {

        Long userId = getUserIdFromHeader(authHeader);
        UpdateResponse response = commentService.update(userId, commentId, mr);
        return ResponseEntity.ok(response);
    }


    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long commentId,
            @RequestHeader("Authorization") String authHeader) {

        Long userId = getUserIdFromHeader(authHeader);
        commentService.delete(commentId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<CommentResponse>> getCommentsFromPost(@PathVariable Long postId, @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserIdFromHeader(authHeader);
        return ResponseEntity.ok(commentService.getByPost(postId, userId));
    }
}
