package com.ivancroce.backend.tools;


import kong.unirest.core.HttpResponse;
import kong.unirest.core.JsonNode;
import kong.unirest.core.Unirest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;


@Component
@Slf4j
public class MailgunSender {
    private String apiKey;
    private String domain;
    private String senderEmail;

    public MailgunSender(@Value("${mailgun.api.key}") String apiKey,
                         @Value("${mailgun.domain.name}") String domain,
                         @Value("${mailgun.sender.email}") String senderEmail) {
        this.apiKey = apiKey;
        this.domain = domain;
        this.senderEmail = senderEmail;
    }

    public void sendFeedbackEmail(String feedbackType, String message, String userEmail,
                                  String country1, String country2) {
        String subject = String.format("EduAtlas Feedback - %s (%s vs %s)",
                feedbackType.toUpperCase(), country1, country2);

        String textBody = String.format(
                "Type: %s\nCountries: %s vs %s\nUser: %s\n\nMessage:\n%s",
                feedbackType, country1, country2,
                userEmail != null ? userEmail : "Anonymous", message
        );

        try {
            HttpResponse<JsonNode> response = Unirest.post("https://api.mailgun.net/v3/" + this.domain + "/messages")
                    .basicAuth("api", this.apiKey)
                    .queryString("from", this.senderEmail)
                    .queryString("to", this.senderEmail) // using the same email for test/demo
                    .queryString("subject", subject)
                    .queryString("text", textBody)
                    .asJson();

            log.info("Feedback email sent: {}", response.isSuccess());
        } catch (Exception e) {
            log.error("Error sending feedback", e);
        }
    }}
