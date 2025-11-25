import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [
    CommonModule,  
    RouterModule   
  ],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css'
})

export class BreadcrumbComponent {

  breadcrumbs: { label: string; url: string }[] = [];

  constructor(private router: Router, private route: ActivatedRoute) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.breadcrumbs = this.buildBreadcrumbs(this.route.root);
      });
  }

  buildBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: any[] = []): any[] {
    let children = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (let child of children) {

      if (child.snapshot.routeConfig && child.snapshot.routeConfig.path) {
        let routeURL = child.snapshot.routeConfig.path;
        url += `/${routeURL}`;

        if (child.snapshot.data['breadcrumb']) {
          breadcrumbs.push({
            label: child.snapshot.data['breadcrumb'],
            url: url
          });
        }
      }

      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }
}
