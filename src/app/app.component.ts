import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from "./layout/nav/nav.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavComponent, RouterOutlet,],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'convam-cliente';
}
