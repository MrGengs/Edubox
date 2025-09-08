import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.page.html',
  styleUrls: ['./privacy-policy.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
})
export class PrivacyPolicyPage implements OnInit {
  constructor(private navCtrl: NavController) { }

  ngOnInit() {}

  goBack() {
    this.navCtrl.back();
  }
}
