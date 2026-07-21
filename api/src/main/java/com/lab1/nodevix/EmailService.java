package com.lab1.nodevix;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final Resend resend;
    private final String fromEmail;

    public EmailService(@Value("${resend.api.key}") String apiKey,
                        @Value("${resend.from}") String fromEmail) {
        this.resend = new Resend(apiKey);
        this.fromEmail = fromEmail;
    }

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

        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromEmail)
                    .to(toEmail)
                    .subject(subject)
                    .html(body)
                    .build();

            CreateEmailResponse data = resend.emails().send(params);
            log.info("Email sent to {} for {} on project '{}' - ID: {}", toEmail, interactionType, projectName, data.getId());
        } catch (ResendException e) {
            log.error("Failed to send email to {} for {} on project '{}': {}", toEmail, interactionType, projectName, e.getMessage());
        }
    }
}
