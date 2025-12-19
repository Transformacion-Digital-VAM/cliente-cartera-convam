import { Component } from '@angular/core';
import { NavComponent } from "./layout/nav/nav.component";
import { FooterComponent } from "./layout/footer/footer.component";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavComponent, FooterComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'convam-cliente';
}
