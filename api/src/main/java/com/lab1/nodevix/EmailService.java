package com.lab1.nodevix;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    @Value("${mail.from.email}")
    private String fromEmail;

    @Value("${mail.from.name}")
    private String fromName;

    @Async
    public void sendInteractionNotification(String toEmail, String authorName, String interactionType, String projectName) {
        String subject = "New interaction on your project: " + projectName;
        String body;

        if (interactionType.equalsIgnoreCase("COMMENT")) {
            body = "<p>Hello <strong>" + authorName + "</strong>!</p>" +
                    "<p>Someone just commented your project '<strong>" + projectName + "</strong>'.</p>" +
                    "<p>Go check it out in NodeVix!</p>";
        } else {
            body = "<p>Hello <strong>" + authorName + "</strong>!</p>" +
                    "<p>Someone just gave a <strong>" + interactionType + "</strong> to your project '<strong>" + projectName + "</strong>'.</p>" +
                    "<p>Go check it out in NodeVix!</p>";
        }

        Map<String, Object> payload = Map.of(
                "sender", Map.of("name", fromName, "email", fromEmail),
                "to", List.of(Map.of("email", toEmail, "name", authorName)),
                "subject", subject,
                "htmlContent", body
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://api.brevo.com/v3/smtp/email",
                    request,
                    String.class
            );
            log.info("Email sent to {} for {} on project '{}' - Status: {}", toEmail, interactionType, projectName, response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to send email to {} for {} on project '{}': {}", toEmail, interactionType, projectName, e.getMessage());
        }
    }
}
