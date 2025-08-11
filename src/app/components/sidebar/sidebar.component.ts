import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonService } from '../../services/common.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SidebarComponent implements OnInit {
  avatarUrl$!: ReturnType<AuthService['avatarUrl$']['subscribe']> extends never
    ? any
    : typeof this.authService.avatarUrl$; // ou simplement: any/Observable<string|undefined>

  constructor(
    protected commonService: CommonService,
    protected authService: AuthService
  ) {
    this.avatarUrl$ = this.authService.avatarUrl$;
  }

  async ngOnInit() {
    await this.authService.refreshAvatarUrl();
  }
}
