package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/smtp"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

type TranscriptRequest struct {
	Content string `json:"content"`
}

type OpenAIRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenAIResponse struct {
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
}

type EmailRequest struct {
	Emails  []string `json:"emails"`
	Subject string   `json:"subject"`
	Body    string   `json:"body"`
}

type EmailResult struct {
	Email   string `json:"email"`
	Status  string `json:"status"`
	Success bool   `json:"success"`
}

type EmailResponse struct {
	Results []EmailResult `json:"results"`
	Message string        `json:"message"`
}

func summarizeWithOpenAI(transcript string) (map[string]interface{}, error) {
	// ✅ Load environment variables from .env file
	_ = godotenv.Load()

	apiKey := os.Getenv("OPENAI_API_KEY")

	prompt := fmt.Sprintf(`Summarize this meeting transcript. Return:
1. A brief summary
2. Key action points
3. Decisions made

Transcript:
%s`, transcript)

	body := OpenAIRequest{
		Model: "gpt-4o-mini",
		Messages: []Message{
			{Role: "user", Content: prompt},
		},
	}

	jsonData, _ := json.Marshal(body)
	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Add("Authorization", "Bearer "+apiKey)
	req.Header.Add("Content-Type", "application/json")

	client := &http.Client{}
	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	bodyBytes, _ := io.ReadAll(res.Body)

	// Debug log
	fmt.Println("🔥 OpenAI Raw Response:", string(bodyBytes))

	var openAIRes OpenAIResponse
	json.Unmarshal(bodyBytes, &openAIRes)

	if len(openAIRes.Choices) == 0 {
		return nil, fmt.Errorf("OpenAI response was empty. Try again or check the prompt/input")
	}

	responseMap := map[string]interface{}{
		"summary": openAIRes.Choices[0].Message.Content,
	}

	return responseMap, nil
}

func sendEmail(to, subject, body string) error {
	from := os.Getenv("GMAIL_EMAIL")    // your Gmail address
	password := os.Getenv("GMAIL_PASS") // Gmail App Password

	smtpHost := "smtp.gmail.com"
	smtpPort := "587"

	message := []byte("Subject: " + subject + "\r\n" +
		"\r\n" + body + "\r\n")

	auth := smtp.PlainAuth("", from, password, smtpHost)

	return smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{to}, message)
}

func sendEmailHandler(c *gin.Context) {
	var req EmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if len(req.Emails) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No email addresses provided"})
		return
	}

	if len(req.Emails) > 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Maximum 10 emails allowed"})
		return
	}

	var results []EmailResult
	successCount := 0

	for _, email := range req.Emails {
		err := sendEmail(email, req.Subject, req.Body)
		if err != nil {
			results = append(results, EmailResult{
				Email:   email,
				Status:  fmt.Sprintf("Failed: %v", err),
				Success: false,
			})
		} else {
			results = append(results, EmailResult{
				Email:   email,
				Status:  "Sent successfully",
				Success: true,
			})
			successCount++
		}
	}

	response := EmailResponse{
		Results: results,
		Message: fmt.Sprintf("Successfully sent to %d/%d recipients", successCount, len(req.Emails)),
	}

	c.JSON(http.StatusOK, response)
}

func main() {
	router := gin.Default()
	router.Use(cors.Default())

	// Summarization endpoint
	router.POST("/api/parse-transcript", func(c *gin.Context) {
		var req TranscriptRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
			return
		}

		summary, err := summarizeWithOpenAI(req.Content)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, summary)
	})

	// Email endpoint
	router.POST("/api/send-email", sendEmailHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server running on port %s", port)
	router.Run(":" + port)
}
