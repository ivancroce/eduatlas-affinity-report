package com.ivancroce.backend.controllers;

import com.ivancroce.backend.exceptions.ValidationException;
import com.ivancroce.backend.payloads.FeedbackRequest;
import com.ivancroce.backend.payloads.FeedbackRespDTO;
import com.ivancroce.backend.tools.MailgunSender;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/feedback")
@ResponseStatus(HttpStatus.OK)
public class FeedbackController {
    @Autowired
    private MailgunSender mailgunSender;

    @PostMapping
    @ResponseStatus(HttpStatus.OK)
    public FeedbackRespDTO submitFeedback(@Validated @RequestBody FeedbackRequest request, BindingResult validationResult) {
        if (validationResult.hasErrors()) {
            List<String> errors = validationResult.getFieldErrors().stream()
                    .map(fieldError -> fieldError.getDefaultMessage())
                    .toList();
            throw new ValidationException(errors);
        }
        mailgunSender.sendFeedbackEmail(
                request.feedbackType(),
                request.message(),
                request.userEmail(),
                request.country1(),
                request.country2()
        );

        FeedbackRespDTO responseBody = new FeedbackRespDTO(
                "Feedback submitted successfully!",
                request.userEmail() != null ? request.userEmail() : "Anonymous",
                request.feedbackType(),
                LocalDateTime.now()
        );

        return responseBody;
    }
}
