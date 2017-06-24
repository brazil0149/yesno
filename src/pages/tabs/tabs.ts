import {Component, OnInit, ViewChild } from '@angular/core';
import { NavController, Events, Tabs } from 'ionic-angular';
import { HomePage } from '../home/home';
import { FavoritesPage } from '../favorites/favorites';
import { ProfilePage } from '../profile/profile';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage implements OnInit {
  @ViewChild('myTabs') tabRef: Tabs;
  // this tells the tabs component which Pages
  // should be each tab's root Page
  public homePage: any;
  public profilePage: any;

  public newThreads: string = '';
  public selectedTab: number = -1;

    constructor(public navCtrl: NavController,
        public authService: AuthService,
        public events: Events) {
        // this tells the tabs component which Pages
        // should be each tab's root Page
        this.homePage = HomePage;
        this.profilePage = ProfilePage;
    }

    ngOnInit() {
        this.startListening();
    }

    startListening() {
        var self = this;

        self.events.subscribe('thread:created', (threadData) => {
            if (self.newThreads === '') {
                self.newThreads = '1';
            } else {
                self.newThreads = (+self.newThreads + 1).toString();
            }
        });

        self.events.subscribe('threads:viewed', (threadData) => {
            self.newThreads = '';
        });
    }

    clicked() {
        var self = this;

        if (self.newThreads !== '') {
            self.events.publish('threads:add');
            self.newThreads = '';
        }
    }
}
