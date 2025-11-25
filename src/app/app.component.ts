import { Component } from '@angular/core';
import { NavComponent } from "./layout/nav/nav.component";
import { FooterComponent } from "./layout/footer/footer.component";
import { RouterOutlet } from "@angular/router";
import { BreadcrumbComponent } from "./layout/breadcrumb/breadcrumb.component";

@Component({
  selector: 'app-root',
  standalone: true,
<<<<<<< HEAD
  imports: [NavComponent, FooterComponent, RouterOutlet, BreadcrumbComponent],
=======
  imports: [NavComponent, FooterComponent, RouterOutlet],
>>>>>>> deec42320ae6626482b454a1dd2e08d321fce81a
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'convam-cliente';
}
