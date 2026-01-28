import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interface for chat messages
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Service for handling communication with the Trump ChatBot backend
 * Uses RAG (Retrieval Augmented Generation) via API Gateway -> Lambda -> Pinecone + Claude
 */
@Injectable({
  providedIn: 'root'
})
export class BedrockChatService {
  // Store conversation history in memory
  private conversationHistory: Message[] = [];
  
  // API Gateway endpoint URL
  private readonly apiUrl = "https://5b8jdhgg45.execute-api.us-east-1.amazonaws.com/Dev"
  
  // Reactive signals for UI state management
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Send a message to the Trump ChatBot via API Gateway
   * @param userMessage - The user's question/message
   * @returns Observable that emits the bot's response
   */
  sendMessage(userMessage: string): Observable<string> {
    // Set loading state and clear any previous errors
    this.isLoading.set(true);
    this.error.set(null);

    // Add user message to conversation history
    const userMsg: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    this.conversationHistory.push(userMsg);

    // Create HTTP request observable
    return new Observable(observer => {
      // Set request headers
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });
      
      // Make POST request to API Gateway
      this.http.post<{answer: string, error?: string}>(`${this.apiUrl}/chatquery`, 
        { question: userMessage },
        { headers }
      ).subscribe({
        next: (data) => {
          // Handle API response
          if (data.error) {
            throw new Error(data.error);
          }
          
          const answer = data.answer || 'No response received';
          
          // Add bot response to conversation history
          const assistantMsg: Message = {
            role: 'assistant',
            content: answer,
            timestamp: new Date()
          };
          this.conversationHistory.push(assistantMsg);
          
          // Emit response and complete
          observer.next(answer);
          this.isLoading.set(false);
          observer.complete();
        },
        error: (error) => {
          // Handle HTTP errors
          console.error('API Gateway Error:', error);
          this.error.set(error.message || 'Failed to get response from API');
          this.isLoading.set(false);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Clear the conversation history and reset error state
   */
  clearHistory(): void {
    this.conversationHistory = [];
    this.error.set(null);
  }

  /**
   * Get a copy of the current conversation history
   * @returns Array of messages in the conversation
   */
  getHistory(): Message[] {
    return [...this.conversationHistory];
  }
}
