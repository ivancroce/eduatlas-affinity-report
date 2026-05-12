package com.ivancroce.backend.exceptions;

import com.ivancroce.backend.payloads.ErrorDTO;
import com.ivancroce.backend.payloads.ErrorsWithListDTO;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@Slf4j
@RestControllerAdvice
public class ExceptionsHandler {

    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<ErrorDTO> handleTooManyRequests(TooManyRequestsException exception) {
        ErrorDTO body = new ErrorDTO(exception.getMessage(), LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("Retry-After", String.valueOf(exception.getRetryAfterSeconds()))
                .body(body);
    }

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
        log.warn("Unauthorized: {}", exception.getMessage());
        return new ErrorDTO(exception.getMessage(), LocalDateTime.now());
    }

    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND) // 404
    public ErrorDTO handleNotFound(NotFoundException exception) {
        return new ErrorDTO(exception.getMessage(), LocalDateTime.now());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST) // 400
    public ErrorDTO handleMethodArgumentNotValid(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .findFirst()
                .orElse("Validation failed");
        return new ErrorDTO(message, LocalDateTime.now());
    }

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST) // 400
    public ErrorDTO handleConstraintViolation(ConstraintViolationException exception) {
        String message = exception.getConstraintViolations().stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .findFirst()
                .orElse("Invalid request parameter");
        return new ErrorDTO(message, LocalDateTime.now());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST) // 400
    public ErrorDTO handleMissingParam(MissingServletRequestParameterException exception) {
        return new ErrorDTO("Missing required parameter: " + exception.getParameterName(), LocalDateTime.now());
    }

    @ExceptionHandler(AuthorizationDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN) // 403
    public ErrorDTO handleForbidden(AuthorizationDeniedException exception) {
        log.warn("Forbidden: {}", exception.getMessage());
        return new ErrorDTO("Authorization denied", LocalDateTime.now());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR) // 500
    public ErrorDTO handleServerError(Exception exception) {
        log.error("Unhandled {}: {}", exception.getClass().getSimpleName(), exception.getMessage(), exception);
        return new ErrorDTO("Ooops, we have a problem!", LocalDateTime.now());
    }
}
