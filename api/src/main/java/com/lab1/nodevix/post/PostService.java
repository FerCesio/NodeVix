package com.lab1.nodevix.post;

import com.lab1.nodevix.post.dtos.InteractionResponse;
import com.lab1.nodevix.post.dtos.PostListResponse;
import com.lab1.nodevix.postInteraction.PostInteraction;
import com.lab1.nodevix.postInteraction.PostInteractionRepository;
import com.lab1.nodevix.project.Project;
import com.lab1.nodevix.project.ProjectRepository;
import com.lab1.nodevix.user.User;
import com.lab1.nodevix.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


@Service
public class PostService {
    private final PostRepository postRepo;
    private final ProjectRepository projectRepo;
    private final PostInteractionRepository postLikeRepo;
    private final UserRepository userRepo;

    public PostService(PostRepository postRepo, ProjectRepository projectRepo, PostInteractionRepository postLikeRepo, UserRepository userRepo) {
        this.postRepo = postRepo;
        this.projectRepo = projectRepo;
        this.postLikeRepo = postLikeRepo;
        this.userRepo = userRepo;
    }

    @Transactional
    public void create(Long projectId){
        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("No se encontró el proyecto"));

        Post post = new Post();
        post.setProject(project);

        postRepo.save(post);
    }


    public void delete(Long postId){
        if (!postRepo.existsById(postId)) {
            throw new EntityNotFoundException("No existe el post con id: " + postId);
        }
        postRepo.deleteById(postId);
    }

    @Transactional
    public InteractionResponse like(Long postId, Long userId){
        Post post = postRepo.findById(postId).orElseThrow();
        User user = userRepo.findById(userId).orElseThrow();

        // Buscamos si ya existe un registro en la tabla intermedia
        Optional<PostInteraction> existingLike = postLikeRepo.findByPostAndUser(post, user);

        boolean userLikedNow = false;

        if (existingLike.isEmpty()) {
            PostInteraction newLike = new PostInteraction(user, post, true);
            postLikeRepo.save(newLike);
            post.setLikes(post.getLikes() + 1);
            userLikedNow = true;
        }

        postRepo.save(post);


        return new InteractionResponse(
                post.getLikes(),
                post.getDislikes(),
                post.getViews(),
                userLikedNow,
                false
        );
    }

    @Transactional
    public InteractionResponse dislike(Long postId, Long userId){
        Post post = postRepo.findById(postId).orElseThrow();
        User user = userRepo.findById(userId).orElseThrow();

        // Buscamos si ya existe un registro en la tabla intermedia
        Optional<PostInteraction> existingInteraction = postLikeRepo.findByPostAndUser(post, user);

        boolean userDislikedNow = false;

        if (existingInteraction.isEmpty()) {
            PostInteraction newLike = new PostInteraction(user, post, false);
            postLikeRepo.save(newLike);
            post.setDislikes(post.getDislikes() + 1);
            userDislikedNow = true;
        } else {
            PostInteraction interaction = existingInteraction.get();
            if (interaction.isLike()){
                interaction.setLike(false);
                postLikeRepo.save(interaction);

                post.setLikes(Math.max(0, post.getLikes() - 1));
                post.setDislikes(post.getDislikes() + 1);
                userDislikedNow = true;
            }
        }

        postRepo.save(post);

        return new InteractionResponse(
                post.getLikes(),
                post.getDislikes(),
                post.getViews(),
                false,
                userDislikedNow
        );
    }

    @Transactional
    public InteractionResponse view(Long postId){
        Post post = postRepo.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post no encontrado"));
        post.setViews(post.getViews() + 1);
        return new InteractionResponse(
                post.getLikes(),
                post.getDislikes(),
                post.getViews(),
                false,
                false
        );
    }

    public List<PostListResponse> getAll(){
        return postRepo.findAllWithProject().stream().map(p -> {
            String owner = userRepo.findByProjectId(p.getProject().getId())
                    .stream()
                    .findFirst()
                    .map(User::getName)
                    .orElse("Unknown");

            return new PostListResponse(
                    p.getId(),
                    p.getViews(),
                    p.getLikes(),
                    p.getDislikes(),
                    p.getProject().getName(),
                    p.getProject().getDescription(),
                    owner
            );
        }).collect(Collectors.toList());
    }
}
