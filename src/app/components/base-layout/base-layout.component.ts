import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonService } from '../../services/common.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
    selector: 'app-base-layout',
    standalone: true,
    imports: [RouterOutlet, NgClass, SidebarComponent],
    templateUrl: './base-layout.component.html',
})
export class BaseLayoutComponent {

    constructor(
        protected commonService: CommonService
    ) { }

}
