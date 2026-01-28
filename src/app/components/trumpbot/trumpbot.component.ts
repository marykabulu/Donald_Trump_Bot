import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BedrockChatService, Message } from '../../services/bedrock-chat.service';

/**
 * Main component for the Trump ChatBot interface
 * Handles user interactions and displays conversation history
 */
@Component({
  selector: 'app-trumpbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trumpbot.component.html',
  styleUrl: './trumpbot.component.css'
})
export class TrumpbotComponent implements OnInit, AfterViewChecked {
  // Reference to the messages container for auto-scrolling
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  // Reactive signals for component state
  messages = signal<Message[]>([]);           // Chat messages array
  userInput = signal('');                     // Current user input
  isStreaming = signal(false);                // Whether bot is responding
  currentStreamingMessage = signal('');       // Current streaming response

  constructor(public bedrockService: BedrockChatService) {}

  /**
   * Initialize component and load any existing conversation history
   */
  ngOnInit(): void {
    this.messages.set(this.bedrockService.getHistory());
  }

  /**
   * Auto-scroll to bottom after view updates
   */
  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  /**
   * Send user message to the Trump ChatBot
   */
  async sendMessage(): Promise<void> {
    const message = this.userInput().trim();
    // Prevent sending empty messages or multiple concurrent requests
    if (!message || this.isStreaming()) {
      return;
    }

    // Clear input field
    this.userInput.set('');

    // Add user message to chat UI
    const userMsg: Message = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    this.messages.update(msgs => [...msgs, userMsg]);

    // Set streaming state and prepare for response
    this.isStreaming.set(true);
    this.currentStreamingMessage.set('');

    // Create placeholder for bot response
    const assistantMsg: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    this.messages.update(msgs => [...msgs, assistantMsg]);

    try {
      // Send message to backend and handle streaming response
      this.bedrockService.sendMessage(message).subscribe({
        next: (chunk: string) => {
          // Update streaming message content
          this.currentStreamingMessage.update(current => current + chunk);
          // Update the last message (bot response) with new content
          this.messages.update(msgs => {
            const updated = [...msgs];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: this.currentStreamingMessage()
            };
            return updated;
          });
        },
        error: (error) => {
          console.error('Error streaming response:', error);
          this.isStreaming.set(false);
          this.currentStreamingMessage.set('');
          // Display error message in chat
          this.messages.update(msgs => {
            const updated = [...msgs];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: `Error: ${error.message || 'Failed to get response'}`
            };
            return updated;
          });
        },
        complete: () => {
          // Reset streaming state when response is complete
          this.isStreaming.set(false);
          this.currentStreamingMessage.set('');
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      this.isStreaming.set(false);
    }
  }

  /**
   * Handle Enter key press to send message
   * @param event - Keyboard event
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Clear the entire chat conversation
   */
  clearChat(): void {
    this.bedrockService.clearHistory();
    this.messages.set([]);
    this.currentStreamingMessage.set('');
  }

  /**
   * Auto-scroll the messages container to the bottom
   */
  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      // Ignore scroll errors
    }
  }
}
