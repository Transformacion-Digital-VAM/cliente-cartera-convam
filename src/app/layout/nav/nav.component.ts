import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit, OnDestroy {
  private sub: Subscription | null = null;
  public user: any = null;

  // banderas
  public isAdmin = false;
  public isEjecutiva = false;
  public isTesoreria = false;
  public isCoordinador = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.sub = this.authService.getUserObservable().subscribe(user => {
      this.user = user;
      this.isAdmin = !!user && user.rol_id === 4;
      this.isCoordinador = !!user && user.rol_id === 3;
      this.isTesoreria = !!user && user.rol_id === 2;
      this.isEjecutiva = !!user && user.rol_id === 1;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch {
      this.router.navigate(['/login']);
    }
  }
}
