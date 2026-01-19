import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Rol {
  id_rol: number;
  nombre_rol: string;
}

import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class RolService {
  private apiUrl = `${environment.apiUrl}/rol`;

  constructor(private http: HttpClient) { }

  getRoles(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
