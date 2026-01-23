// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class LoggingService {

//   constructor() { }
// }

// src/app/services/logging.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../app/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private isProduction = environment.production;

  log(message: any, ...optionalParams: any[]) {
    if (!this.isProduction) {
      console.log(message, ...optionalParams);
    }
  }

  warn(message: any, ...optionalParams: any[]) {
    if (!this.isProduction) {
      console.warn(message, ...optionalParams);
    }
  }

  error(message: any, ...optionalParams: any[]) {
    // Los errores sí los mostramos siempre
    console.error(message, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    if (!this.isProduction) {
      console.debug(message, ...optionalParams);
    }
  }

  info(message: any, ...optionalParams: any[]) {
    if (!this.isProduction) {
      console.info(message, ...optionalParams);
    }
  }
}