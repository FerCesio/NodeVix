package com.lab1.nodevix.comments.dtos;

public class UpdateResponse {
    private String message;
    private String modifiedOn;


    public UpdateResponse(String message, String modifiedOn) {
        this.message = message;
        this.modifiedOn = modifiedOn;
    }

    public String getMessage() {
        return message;
    }

    public String getModifiedOn() {
        return modifiedOn;
    }

}
