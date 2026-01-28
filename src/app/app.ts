import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TrumpbotComponent } from './components/trumpbot/trumpbot.component';

/**
 * Root application component
 * Serves as the main container for the Trump ChatBot application
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TrumpbotComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Root component - no additional logic needed
  // The TrumpbotComponent handles all chat functionality
}
