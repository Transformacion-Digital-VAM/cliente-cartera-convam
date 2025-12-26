// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Router } from '@angular/router';
// import { AuthService } from '../../services/auth.service';
// import { Observable } from 'rxjs';

// @Component({
//   selector: 'app-nav',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './nav.component.html',
//   styleUrls: ['./nav.component.css']
// })
// export class NavComponent implements OnInit {
//   currentUser$: Observable<any>;

//   constructor(
//     private authService: AuthService,
//     private router: Router
//   ) {
//     this.currentUser$ = this.authService.currentUser$;
//   }

//   ngOnInit(): void {
//     console.log('NavComponent inicializado');
//   }

//   async logout(): Promise<void> {
//     try {
//       console.log('Cerrando sesión...');
//       await this.authService.logout();
      
//       // Redirigir al login después de cerrar sesión
//       this.router.navigate(['/login']);
      
//       console.log('Sesión cerrada exitosamente');
//     } catch (error) {
//       console.error('Error al cerrar sesión:', error);
//       // Aún así redirigir al login
//       this.router.navigate(['/login']);
//     }
//   }
// }



// nav.component.ts
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
