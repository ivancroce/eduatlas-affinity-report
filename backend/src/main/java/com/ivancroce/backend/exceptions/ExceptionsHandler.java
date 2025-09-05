package com.ivancroce.backend.exceptions;

import com.ivancroce.backend.payloads.ErrorDTO;
import com.ivancroce.backend.payloads.ErrorsWithListDTO;
import org.springframework.http.HttpStatus;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class ExceptionsHandler {

    @ExceptionHandler(BadRequestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST) // 400
    public ErrorDTO handleBadRequest(BadRequestException exception) {
        return new ErrorDTO(exception.getMessage(), LocalDateTime.now());
    }

    @ExceptionHandler(ValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST) // 400
    public ErrorsWithListDTO handleValidationErrors(ValidationException exception) {
        return new ErrorsWithListDTO(exception.getMessage(), LocalDateTime.now(), exception.getErrorMessages());
    }

    @ExceptionHandler(UnauthorizedException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED) // 401
    public ErrorDTO handleUnauthorized(UnauthorizedException exception) {
        exception.printStackTrace();
        return new ErrorDTO(exception.getMessage(), LocalDateTime.now());
    }

    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND) // 404
    public ErrorDTO handleNotFound(NotFoundException exception) {
        return new ErrorDTO(exception.getMessage(), LocalDateTime.now());
    }

    @ExceptionHandler(AuthorizationDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN) // 403
    public ErrorDTO handleForbidden(AuthorizationDeniedException exception) {
        exception.printStackTrace();
        return new ErrorDTO("Authorization denied", LocalDateTime.now());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR) // 500
    public ErrorDTO handleServerError(Exception exception) {
        exception.printStackTrace();//questo mi stampa in console lo stack trace per capire dove sta l'errore
        return new ErrorDTO("Ooops, we have a problem!", LocalDateTime.now());
    }
}
