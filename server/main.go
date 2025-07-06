package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
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

func summarizeWithOpenAI(transcript string) (map[string]interface{}, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")

	prompt := fmt.Sprintf(`Summarize this meeting transcript. Return:
1. A brief summary
2. Key action points
3. Decisions made

Transcript:
%s`, transcript)

	body := OpenAIRequest{
		Model: "gpt-3.5-turbo",
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

	bodyBytes, _ := ioutil.ReadAll(res.Body)
	var openAIRes OpenAIResponse
	json.Unmarshal(bodyBytes, &openAIRes)

	responseMap := map[string]interface{}{
		"summary": openAIRes.Choices[0].Message.Content,
	}
	return responseMap, nil
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

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server running on port %s", port)
	router.Run(":" + port)
}
