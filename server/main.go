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
	ToEmail string `json:"toEmail"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

func summarizeWithOpenAI(transcript string) (map[string]interface{}, error) {
	// ✅ Load environment variables from .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatal("❌ Error loading .env file")
	}

	// Now you can use os.Getenv() anywhere after this
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

	// Log raw response for debugging
	fmt.Println("🔥 OpenAI Raw Response:", string(bodyBytes))

	var openAIRes OpenAIResponse
	json.Unmarshal(bodyBytes, &openAIRes)

	// ✅ Add a proper check:
	if len(openAIRes.Choices) == 0 {
		return nil, fmt.Errorf("OpenAI response was empty. Try again or check the prompt/input")
	}

	responseMap := map[string]interface{}{
		"summary": openAIRes.Choices[0].Message.Content,
	}

	fmt.Println("Raw OpenAI response:", string(bodyBytes))

	return responseMap, nil

}

func sendSummaryEmail(toEmail string, summary string) error {
	// Gmail SMTP config
	from := os.Getenv("GMAIL_EMAIL")        // e.g. tausifkhan4171@gmail.com
	password := os.Getenv("GMAIL_APP_PASS") // 16-digit app password
	smtpHost := "smtp.gmail.com"
	smtpPort := "587"

	// Message
	subject := "Subject: 📄 Your Acto Summary is Ready\r\n"
	body := fmt.Sprintf("Here is your meeting summary:\r\n\n%s", summary)
	message := []byte(subject + "\r\n" + body)

	// Auth
	auth := smtp.PlainAuth("", from, password, smtpHost)

	// Send email
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{toEmail}, message)
	if err != nil {
		return err
	}

	fmt.Println("✅ Email sent successfully!")
	return nil
}

func sendEmail(to, subject, body string) error {
	from := os.Getenv("GMAIL_EMAIL")    // your Gmail address
	password := os.Getenv("GMAIL_PASS") // App Password (not your real Gmail password!)

	// Gmail SMTP server config
	smtpHost := "smtp.gmail.com"
	smtpPort := "587"

	// Message format
	message := []byte("Subject: " + subject + "\r\n" +
		"\r\n" + body + "\r\n")

	// Auth
	auth := smtp.PlainAuth("", from, password, smtpHost)

	// Send email
	return smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{to}, message)
}

func sendEmailHandler(w http.ResponseWriter, r *http.Request) {
	var req EmailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	err := sendEmail(req.ToEmail, req.Subject, req.Body)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to send email: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, "Email sent successfully")
}

func main() {
	router := gin.Default()

	router.Use(cors.Default()) // allows frontend CORS

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

	router.POST("/api/send-email", sendEmailHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server running on port %s", port)
	router.Run(":" + port)

}
