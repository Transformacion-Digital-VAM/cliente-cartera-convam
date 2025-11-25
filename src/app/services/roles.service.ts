import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Rol {
  id_rol: number;
  nombre_rol: string;
}

@Injectable({ providedIn: 'root' })
export class RolService {
  private apiUrl = 'http://localhost:3000/rol';

  constructor(private http: HttpClient) {}

  getRoles(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
