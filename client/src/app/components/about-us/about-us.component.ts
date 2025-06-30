import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../common/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-about-us',
  imports: [CommonModule, BreadcrumbComponent],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.css'
})
export class AboutUsComponent implements OnInit {

  breadCrumbItems : any[] = [];
  ngOnInit(): void {
    this.breadCrumbItems = [
            {label: 'Home', route: '/', icon: 'fa fa-home'},
            {label: 'About us'},
          ];
  }
}
