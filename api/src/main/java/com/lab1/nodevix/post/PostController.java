package com.lab1.nodevix.post;

import com.lab1.nodevix.post.dtos.CloneRequest;
import com.lab1.nodevix.post.dtos.CloneResponse;
import com.lab1.nodevix.post.dtos.InteractionResponse;
import com.lab1.nodevix.post.dtos.PostListResponse;
import com.lab1.nodevix.security.JWTService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> delete(@PathVariable Long postId) {
       postService.delete(postId);
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
    public ResponseEntity<Page<PostListResponse>> getAll(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size){
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(postService.getAll(pageable));
    }

    @GetMapping("/me")
    public ResponseEntity<List<PostListResponse>> getUserPosts(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long userID = jwtService.extractUserId(token);
        return ResponseEntity.ok(postService.getUserPosts(userID));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostListResponse> getById(@PathVariable Long id){
        return ResponseEntity.ok(postService.getById(id));
    }

    @GetMapping("/{id}/interaction")
    public ResponseEntity<InteractionResponse> getInteractionById(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String authHeader){

        Long userId = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            userId = jwtService.extractUserId(token);
        }
        return ResponseEntity.ok(postService.getInteraction(id, userId));
    }

    @PostMapping("/clone")
    public ResponseEntity<CloneResponse> cloneProject(@RequestHeader(value = "Authorization") String authHeader, @RequestBody CloneRequest request){
        String token = authHeader.substring(7);
        Long userID = jwtService.extractUserId(token);
        return ResponseEntity.ok(postService.cloneProject(userID, request));
    }
}
