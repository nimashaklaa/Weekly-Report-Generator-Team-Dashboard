package com.example.backend.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiChatService {

    @Value("${gemini.api-key:}")
    private String apiKey;

    private final ObjectMapper objectMapper;

    private static final String SYSTEM_PROMPT =
            "You are a helpful assistant for a team weekly report management system. " +
            "You help managers and team members understand report data, summarize key information, " +
            "and answer questions about team performance and reports. " +
            "Keep your answers concise and focused on the context of weekly team reports.";

    public AiChatResponse chat(String userMessage) {
        if (apiKey == null || apiKey.isBlank()) {
            return AiChatResponse.builder()
                    .reply("AI assistant is not configured. Set the GEMINI_API_KEY environment variable.")
                    .build();
        }

        try {
            RestClient client = RestClient.builder()
                    .baseUrl("https://generativelanguage.googleapis.com")
                    .build();

            Map<String, Object> body = Map.of(
                    "system_instruction", Map.of(
                            "parts", List.of(Map.of("text", SYSTEM_PROMPT))
                    ),
                    "contents", List.of(
                            Map.of("parts", List.of(Map.of("text", userMessage)))
                    )
            );

            String responseJson = client.post()
                    .uri("/v1beta/models/gemini-3.6-flash:generateContent?key=" + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            var root = objectMapper.readTree(responseJson);
            String reply = root
                    .path("candidates").get(0)
                    .path("content")
                    .path("parts").get(0)
                    .path("text")
                    .asText("I couldn't process that request.");

            return AiChatResponse.builder().reply(reply).build();

        } catch (Exception e) {
            return AiChatResponse.builder()
                    .reply("Error: " + e.getClass().getSimpleName() + " — " + e.getMessage())
                    .build();
        }
    }
}
