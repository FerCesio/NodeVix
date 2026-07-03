package com.lab1.nodevix;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketController {
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // Cuando en React mandes un mensaje a: /app/project/{projectId}/delta
    @MessageMapping("/project/{projectId}/delta")
    public void handleProjectDelta(
            @DestinationVariable("projectId") String projectId,
            @Payload ProjectDelta delta
    ) {
        System.out.println("¡Java recibió un delta! Acción: " + delta.getAction() + " en Proyecto: " + projectId);
        String destination = "/topic/project/" + projectId;
        messagingTemplate.convertAndSend(destination, delta);
    }
}
