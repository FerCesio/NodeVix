package com.lab1.nodevix.post;

import com.lab1.nodevix.post.dtos.InteractionResponse;
import com.lab1.nodevix.post.dtos.PostListResponse;
import com.lab1.nodevix.security.JWTService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@Controller
@RequestMapping("/api/posts")
public class PostController {
    private final PostService postService;
    private final JWTService jwtService;

    public PostController(PostService postService, JWTService jwtService) {
        this.postService = postService;
        this.jwtService = jwtService;
    }

    @PostMapping("/create/{projectID}")
    public ResponseEntity<Void> create(@PathVariable Long projectID){
        postService.create(projectID);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
       postService.delete(id);
       return ResponseEntity.noContent().build();
    }


    @PatchMapping("/{id}/like")
    public ResponseEntity<InteractionResponse> like(@PathVariable Long id, @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long userID = jwtService.extractUserId(token);
        return ResponseEntity.ok(postService.like(id, userID));
    }


    @PatchMapping("/{id}/dislike")
    public ResponseEntity<InteractionResponse> dislike(@PathVariable Long id,  @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long userID = jwtService.extractUserId(token);
        return ResponseEntity.ok(postService.dislike(id, userID));
    }


    @PatchMapping("/{id}/view")
    public ResponseEntity<InteractionResponse> view(@PathVariable Long id) {
        return ResponseEntity.ok(postService.view(id));
    }

    @GetMapping
    public ResponseEntity<List<PostListResponse>> getAll(){
        return ResponseEntity.ok(postService.getAll());
    }


}
