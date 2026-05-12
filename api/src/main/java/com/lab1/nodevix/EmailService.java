package com.lab1.nodevix;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendInteractionNotification(String toEmail, String authorName, String interactionType, String projectName){
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("New interaction on your project: " + projectName);
        if (interactionType.equalsIgnoreCase("COMMENT")) {
            message.setText("Hello " + authorName + "!\n\n" +
                    "Someone just commented your project '" + projectName + "'.\n" +
                    "Go check it out in NodeVix!");
        } else {
            message.setText("Hello " + authorName + "!\n\n" +
                    "Someone just gave a " + interactionType + " to your project '" + projectName + "'.\n" +
                    "Go check it out in NodeVix!");
        }

        mailSender.send(message);
    }

}
