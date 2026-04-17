package com.lab1.nodevix.comments.dtos;

public class MessageRequest {
    private String message;

    public MessageRequest(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}
