import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'AimDisplay';
  isCollapsed = false;
  currentRoute: string = 'home';

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    this.router.events.subscribe(event => {
      this.currentRoute = this.router.url;
    });
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}
