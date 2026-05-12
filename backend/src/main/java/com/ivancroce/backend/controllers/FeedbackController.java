package com.ivancroce.backend.controllers;

import com.ivancroce.backend.exceptions.ValidationException;
import com.ivancroce.backend.payloads.FeedbackRequest;
import com.ivancroce.backend.payloads.FeedbackRespDTO;
import com.ivancroce.backend.services.FeedbackRateLimiter;
import com.ivancroce.backend.tools.MailgunSender;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/feedback")
@ResponseStatus(HttpStatus.OK)
@RequiredArgsConstructor
@Tag(name = "Feedback", description = "Public endpoint for submitting affinity report feedback via email")
public class FeedbackController {
    private final MailgunSender mailgunSender;
    private final FeedbackRateLimiter rateLimiter;

    @Operation(summary = "Submit feedback", description = "Sends a feedback email via Mailgun. Rate-limited to 3 requests/min per IP and 100 requests/day globally.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Feedback submitted successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error on request body"),
            @ApiResponse(responseCode = "429", description = "Rate limit exceeded — check Retry-After header")
    })
    @SecurityRequirements({})
    @PostMapping
    @ResponseStatus(HttpStatus.OK)
    public FeedbackRespDTO submitFeedback(@Validated @RequestBody FeedbackRequest request,
                                          BindingResult validationResult,
                                          HttpServletRequest httpRequest) {
        if (validationResult.hasErrors()) {
            List<String> errors = validationResult.getFieldErrors().stream()
                    .map(fieldError -> fieldError.getDefaultMessage())
                    .toList();
            throw new ValidationException(errors);
        }
        String ip = rateLimiter.extractIp(httpRequest);
        rateLimiter.checkAllowed(ip);
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
