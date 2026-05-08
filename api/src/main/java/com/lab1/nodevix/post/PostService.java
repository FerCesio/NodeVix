package com.lab1.nodevix.post;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.lab1.nodevix.EmailService;
import com.lab1.nodevix.comments.CommentRepository;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;


@Service
public class PostService {
    private final PostRepository postRepo;
    private final ProjectRepository projectRepo;
    private final PostInteractionRepository postLikeRepo;
    private final UserRepository userRepo;
    private final CommentRepository commentRepo;
    private final EmailService emailService;
    private final Cache<String, Boolean> notificationCache = CacheBuilder.newBuilder()
            .expireAfterWrite(2, TimeUnit.MINUTES)
            .build();

    public PostService(PostRepository postRepo, ProjectRepository projectRepo, PostInteractionRepository postLikeRepo, UserRepository userRepo, CommentRepository commentRepo, EmailService emailService) {
        this.postRepo = postRepo;
        this.projectRepo = projectRepo;
        this.postLikeRepo = postLikeRepo;
        this.userRepo = userRepo;
        this.commentRepo = commentRepo;
        this.emailService = emailService;
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
        commentRepo.deleteByPostId(postId);
        postLikeRepo.deleteByPostId(postId);
        postRepo.deleteById(postId);
    }

    @Transactional
    public InteractionResponse like(Long postId, Long userId){
        Post post = postRepo.findById(postId).orElseThrow();
        User user = userRepo.findById(userId).orElseThrow();

        String cacheKey = postId + "-" + userId;

        if (notificationCache.getIfPresent(cacheKey) == null) {
            // Si no está en la caché, mandamos el mail y lo anotamos
            User owner = userRepo.findByProjectId(post.getProject().getId()).orElseThrow();
            emailService.sendInteractionNotification(
                    owner.getEmail(),
                    owner.getName(),
                    "LIKE",
                    post.getProject().getName()
            );

            notificationCache.put(cacheKey, true); // Bloqueamos futuros mails por X min
        }

        Optional<PostInteraction> existing = postLikeRepo.findByPostAndUser(post, user);

        if (existing.isPresent()) {
            PostInteraction interaction = existing.get();
            if (interaction.isLike()) {
                postLikeRepo.delete(interaction);
                postLikeRepo.flush();
                post.setLikes(Math.max(0, post.getLikes() - 1));
            } else {
                interaction.setLike(true);
                postLikeRepo.save(interaction);
                post.setLikes(post.getLikes() + 1);
                post.setDislikes(Math.max(0, post.getDislikes() - 1));
            }
        } else {
            PostInteraction newLike = new PostInteraction(user, post, true);
            postLikeRepo.save(newLike);
            post.setLikes(post.getLikes() + 1);
        }

        postRepo.save(post);
        return getInteraction(postId, userId); // Reutilizamos el método para devolver el estado real
    }

    @Transactional
    public InteractionResponse dislike(Long postId, Long userId){
        Post post = postRepo.findById(postId).orElseThrow();
        User user = userRepo.findById(userId).orElseThrow();

        String cacheKey = postId + "-" + userId;

        if (notificationCache.getIfPresent(cacheKey) == null) {
            // Si no está en la caché, mandamos el mail y lo anotamos
            User owner = userRepo.findByProjectId(post.getProject().getId()).orElseThrow();
            emailService.sendInteractionNotification(
                    owner.getEmail(),
                    owner.getName(),
                    "DISLIKE",
                    post.getProject().getName()
            );

            notificationCache.put(cacheKey, true); // Bloqueamos futuros mails por 5 min
        }


        Optional<PostInteraction> existing = postLikeRepo.findByPostAndUser(post, user);

        if (existing.isPresent()) {
            PostInteraction interaction = existing.get();
            if (!interaction.isLike()) {
                postLikeRepo.delete(interaction);
                postLikeRepo.flush();
                post.setDislikes(Math.max(0, post.getDislikes() - 1));
            } else {
                interaction.setLike(false);
                postLikeRepo.save(interaction);
                post.setDislikes(post.getDislikes() + 1);
                post.setLikes(Math.max(0, post.getLikes() - 1));
            }
        } else {
            PostInteraction newDislike = new PostInteraction(user, post, false);
            postLikeRepo.save(newDislike);
            post.setDislikes(post.getDislikes() + 1);
        }

        postRepo.save(post);
        return getInteraction(postId, userId);
    }

    @Transactional
    public InteractionResponse view(Long postId){
        Post post = postRepo.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post no encontrado"));

        post.setViews(post.getViews() + 1);
        postRepo.save(post);
        return new InteractionResponse(
                post.getLikes(),
                post.getDislikes(),
                post.getViews(),
                false,
                false
        );
    }

    public Page<PostListResponse> getAll(Pageable pageable){
        Page<Post> postsPage = postRepo.findAll(pageable);
        return postsPage.map(p -> {
            String owner = userRepo.findByProjectId(p.getProject().getId())
                    .stream()
                    .findFirst()
                    .map(User::getName)
                    .orElse("Unknown");

            return new PostListResponse(
                    p.getId(),
                    p.getLikes(),
                    p.getDislikes(),
                    p.getViews(),
                    p.getProject().getName(),
                    p.getProject().getDescription(),
                    owner
            );
        });
    }

    public List<PostListResponse> getUserPosts(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        List<Project> userProjects = user.getProjects();

        if (userProjects.isEmpty()) {
            return new ArrayList<>();
        }

        List<Post> userPosts = postRepo.findByProjectIn(userProjects);

        return userPosts.stream().map(p -> {
            return new PostListResponse(
                    p.getId(),
                    p.getLikes(),
                    p.getDislikes(),
                    p.getViews(),
                    p.getProject().getName(),
                    p.getProject().getDescription(),
                    user.getName()
            );

        }).collect(Collectors.toList());
    }

    public PostListResponse getById(Long id) {
        Post post = postRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Post no encontrado"));
        Long realProjectId = post.getProject().getId();

        User user = userRepo.findByProjectId(realProjectId).orElseThrow(() -> new EntityNotFoundException("No se encontró el proyecto: " + realProjectId));

        return new PostListResponse(
                post.getId(),
                post.getLikes(),
                post.getDislikes(),
                post.getViews(),
                post.getProject().getName(),
                post.getProject().getDescription(),
                user.getName()
        );
    }

    public InteractionResponse getInteraction(Long id, Long userID) {
        Post post = postRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("Post no encontrado"));

        if (userID == null){
            return new InteractionResponse(
                    post.getLikes(),
                    post.getDislikes(),
                    post.getViews(),
                    false,
                    false
            );
        }

        User user = userRepo.findById(userID).orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        Optional<PostInteraction> interaction = postLikeRepo.findByPostAndUser(post, user);

        if (interaction.isEmpty()){
            return new InteractionResponse(
                    post.getLikes(),
                    post.getDislikes(),
                    post.getViews(),
                    false,
                    false
            );
        }

        boolean liked = interaction.get().isLike();
        PostInteraction pi = interaction.get();
        return new InteractionResponse(
                post.getLikes(),
                post.getDislikes(),
                post.getViews(),
                pi.isLike(),
                !pi.isLike()
        );
    }
}
