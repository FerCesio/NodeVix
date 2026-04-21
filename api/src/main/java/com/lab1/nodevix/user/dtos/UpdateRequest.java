package com.lab1.nodevix.user.dtos;

public class UpdateRequest {
    private String userName;
    private String password;
    private String avatarUrl;


    public String getUserName(){
        return userName;
    }

    public String getPassword(){
        return password;
    }

    public String getAvatarUrl(){
        return avatarUrl;
    }
}
