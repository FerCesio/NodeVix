package com.lab1.nodevix;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestingController {

    @GetMapping("/register")
    public String test_1() {
        return "Welcome to home";
    }

    /*
    @GetMapping("/REGISTER")
    public Response test_2(Request) {
        return "Welcome to home";
    }
    */

}
