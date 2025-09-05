package com.ivancroce.backend.exceptions;

import java.util.UUID;

public class NotFoundException extends RuntimeException {
    public NotFoundException(Long id) {
        super("We haven't found an element with id " + id);
    }

    public NotFoundException(String message) {
        super(message);
    }

    public NotFoundException(UUID id) {
        super("The id " + id + " was not found!");
    }


}

