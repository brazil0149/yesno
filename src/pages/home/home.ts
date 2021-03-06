import { Component, OnInit, ViewChild } from '@angular/core';
import { NavController, ModalController, ToastController, Content, NavParams,Events } from 'ionic-angular';

import { IThread} from '../../shared/interfaces';
import { EventCreatePage } from '../event-create/event-create';
import { ThreadCommentsPage } from '../thread-comments/thread-comments';
import { AuthService } from '../../shared/services/auth.service';
import { DataService } from '../../shared/services/data.service';
import { MappingsService } from '../../shared/services/mappings.service';
import { ItemsService} from '../../shared/services/items.service';
import { SqliteService } from '../../shared/services/sqlite.service';
import { IUser } from '../../shared/interfaces';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit {
  @ViewChild(Content) content: Content;
  segment: string = 'all';
  selectedSegment: string = this.segment;
  queryText: string = '';
  public start: number;
  public pageSize: number = 3;
  public loading: boolean = true;
  public internetConnected: boolean = true;
  votes: IThread[];

  userDataLoaded: boolean = false;
  user: IUser;
  username: string;
  userProfile = {};
  firebaseAccount: any = {};
  userStatistics: any = {};

  public threads: Array<IThread> = [];
  public newThreads: Array<IThread> = [];
  public favoriteThreadKeys: string[];
  threadKey: string;
  public buttonClicked: boolean = true; //Whatever you want to initialise it as

  public firebaseConnectionAttempts: number = 0;

  constructor(public navCtrl: NavController,
    public modalCtrl: ModalController,
    public toastCtrl: ToastController,
    public authService: AuthService,
    public dataService: DataService,
    public sqliteService: SqliteService,
    public mappingsService: MappingsService,
    public itemsService: ItemsService,
    public navParams: NavParams,
    public events: Events) { }

  ngOnInit() {
    var self = this;
    self.segment = 'all';
    self.events.subscribe('network:connected', self.networkConnected);
    self.events.subscribe('threads:add', self.addNewThreads);
    self.threadKey = self.navParams.get('threadKey');

    self.checkFirebase();

  }

  public onButtonClick() {
    var self = this;
    if (self.segment === 'three') {
    this.buttonClicked = !this.buttonClicked;}
  }

  checkFirebase() {
    let self = this;
    if (!self.dataService.isFirebaseConnected()) {
      setTimeout(function () {
        console.log('Retry : ' + self.firebaseConnectionAttempts);
        self.firebaseConnectionAttempts++;
        if (self.firebaseConnectionAttempts < 5) {
          self.checkFirebase();
        } else {
          self.internetConnected = false;
          self.dataService.goOffline();
          self.loadSqliteThreads();
        }
      }, 1000);
    } else {
      console.log('Firebase connection found (home.ts) - attempt: ' + self.firebaseConnectionAttempts);
      self.dataService.getStatisticsRef().on('child_changed', self.onThreadAdded);
      if (self.authService.getLoggedInUser() === null) {
        //
      } else {
        self.loadThreads(true);
        this.loadUserProfile();
      }
    }
  }

  loadUserProfile() {
    var self = this;
    self.userDataLoaded = false;

    self.getUserData().then(function (snapshot) {
      let userData: any = snapshot.val();

      self.getUserImage().then(function (url) {
        self.userProfile = {
          username: userData.username,
          dateOfBirth: userData.dateOfBirth,
          image: url,
          totalFavorites: userData.hasOwnProperty('favorites') === true ?
            Object.keys(userData.favorites).length : 0
        };

        self.user = {
          uid : self.firebaseAccount.uid,
          username : userData.username
        };

        self.userDataLoaded = true;
      }).catch(function (error) {
        console.log(error.code);
        self.userProfile = {
          username: userData.username,
          dateOfBirth: userData.dateOfBirth,
          image: 'assets/images/profile.png',
          totalFavorites: userData.hasOwnProperty('favorites') === true ?
            Object.keys(userData.favorites).length : 0
        };
        self.userDataLoaded = true;
      });
    });

    self.getUserThreads();
    self.getUserComments();
  }

  getUserData() {
    var self = this;

    self.firebaseAccount = self.authService.getLoggedInUser();
    return self.dataService.getUser(self.authService.getLoggedInUser().uid);
  }

  getUserImage() {
    var self = this;

    return self.dataService.getStorageRef().child('images/' + self.firebaseAccount.uid + '/profile.png').getDownloadURL();
  }

  getUserThreads() {
    var self = this;

    self.dataService.getUserThreads(self.authService.getLoggedInUser().uid)
      .then(function (snapshot) {
        let userThreads: any = snapshot.val();
        if (userThreads !== null) {
          self.userStatistics.totalThreads = Object.keys(userThreads).length;
        } else {
          self.userStatistics.totalThread = 0;
        }
      });
  }

  getUserComments() {
    var self = this;

    self.dataService.getUserComments(self.authService.getLoggedInUser().uid)
      .then(function (snapshot) {
        let userComments: any = snapshot.val();
        if (userComments !== null) {
          self.userStatistics.totalComments = Object.keys(userComments).length;
        } else {
          self.userStatistics.totalComments = 0;
        }
      });
  }


  loadSqliteThreads() {
    let self = this;

    if (self.threads.length > 0)
      return;

    self.threads = [];
    console.log('Loading from db..');
    self.sqliteService.getThreads().then((data) => {
      console.log('Found in db: ' + data.rows.length + ' threads');
      if (data.rows.length > 0) {
        for (var i = 0; i < data.rows.length; i++) {
          let thread: IThread = {
            key: data.rows.item(i).key,
            title: data.rows.item(i).title,
            question: data.rows.item(i).question,
            category: data.rows.item(i).category,
            dateCreated: data.rows.item(i).datecreated,
            user: { uid: data.rows.item(i).user, username: data.rows.item(i).username },
            comments: data.rows.item(i).comments,
            votesUp: data.rows.item(i).votesUp,
            votesDown: data.rows.item(i).votesDown
          };

          self.threads.push(thread);
          console.log('Thread added from db:' + thread.key);
          console.log(thread);
        }
        self.loading = false;
      }
    }, (error) => {
      console.log('Error: ' + JSON.stringify(error));
      self.loading = true;
    });
  }

  public networkConnected = (connection) => {
    var self = this;
    self.internetConnected = connection[0];
    console.log('NetworkConnected event: ' + self.internetConnected);

    if (self.internetConnected) {
      self.threads = [];
      self.loadThreads(true);
    } else {
      self.notify('Connection lost. Working offline..');
      // save current threads..
      setTimeout(function () {
        console.log(self.threads.length);
        self.sqliteService.saveThreads(self.threads);
        self.loadSqliteThreads();
      }, 1000);
    }
  }

  // Notice function declarion to keep the right this reference
  public onThreadAdded = (childSnapshot, prevChildKey) => {
    let priority = childSnapshot.val(); // priority..
    var self = this;
    self.events.publish('thread:created');
    // fetch new thread..
    self.dataService.getThreadsRef().orderByPriority().equalTo(priority).once('value').then(function (dataSnapshot) {
      let key = Object.keys(dataSnapshot.val())[0];
      let newThread: IThread = self.mappingsService.getThread(dataSnapshot.val()[key], key);
      self.newThreads.push(newThread);
    });
  }

  public addNewThreads = () => {
    var self = this;
    self.newThreads.forEach(function (thread: IThread) {
      self.threads.unshift(thread);
    });

    self.newThreads = [];
    self.scrollToTop();
    self.events.publish('threads:viewed');
  }

  loadThreads(fromStart: boolean) {
    var self = this;

    if (fromStart) {
      self.loading = true;
      self.threads = [];
      self.newThreads = [];

      if (self.segment === 'all') {
        this.dataService.getTotalThreads().then(function (snapshot) {
          self.start = snapshot.val();
          self.getThreads();
        });
      } else {
        self.start = 0;
        self.favoriteThreadKeys = [];
        self.dataService.getFavoriteThreads(self.authService.getLoggedInUser().uid).then(function (dataSnapshot) {
          let favoriteThreads = dataSnapshot.val();
          self.itemsService.getKeys(favoriteThreads).forEach(function (threadKey) {
            self.start++;
            self.favoriteThreadKeys.push(threadKey);
          });
          self.getThreads();
        });
      }
    } else {
      self.getThreads();
    }
  }

  getThreads() {
    var self = this;
    let startFrom: number = self.start - self.pageSize;
    if (startFrom < 0)
      startFrom = 0;
    if (self.segment === 'all') {
      this.dataService.getThreadsRef().orderByPriority().startAt(startFrom).endAt(self.start).once('value', function (snapshot) {
        self.itemsService.reversedItems<IThread>(self.mappingsService.getThreads(snapshot)).forEach(function (thread) {
          self.threads.push(thread);
        });
        self.start -= (self.pageSize + 1);
        self.events.publish('threads:viewed');
        self.loading = false;
      });
    } else {
      self.favoriteThreadKeys.forEach(key => {
        this.dataService.getThreadsRef().child(key).once('value')
          .then(function (dataSnapshot) {
            self.threads.unshift(self.mappingsService.getThread(dataSnapshot.val(), key));
          });
      });
      self.events.publish('threads:viewed');
      self.loading = false;
    }

  }

  addThreadToFavorites() {
      var self = this;
      let currentUser = self.authService.getLoggedInUser();
      if (currentUser != null) {
          self.dataService.addThreadToFavorites(currentUser.uid, self.threadKey)
              .then(function () {
                  let toast = self.toastCtrl.create({
                      message: 'Added to favorites',
                      duration: 3000,
                      position: 'top'
                  });
                  toast.present();
              });
      } else {
          let toast = self.toastCtrl.create({
              message: 'This action is available only for authenticated users',
              duration: 3000,
              position: 'top'
          });
          toast.present();
      }
  }

  searchThreads() {
    var self = this;
    if (self.queryText.trim().length !== 0) {
      self.segment = 'all';
      // empty current threads
      self.threads = [];
      self.dataService.loadThreads().then(function (snapshot) {
        self.itemsService.reversedItems<IThread>(self.mappingsService.getThreads(snapshot)).forEach(function (thread) {
          if (thread.title.toLowerCase().includes(self.queryText.toLowerCase()))
            self.threads.push(thread);
        });
      });
    } else { // text cleared..
      this.loadThreads(true);
    }
  }

  createThread() {
    var self = this;
    let modalPage = this.modalCtrl.create(EventCreatePage);

    modalPage.onDidDismiss((data: any) => {
      if (data) {
        let toast = this.toastCtrl.create({
          message: 'Thread created',
          duration: 3000,
          position: 'bottom'
        });
        toast.present();

        if (data.priority === 1)
          self.newThreads.push(data.thread);

        self.addNewThreads();
      }
    });

    modalPage.present();
  }

  viewComments(key: string) {
    if (this.internetConnected) {
      this.navCtrl.push(ThreadCommentsPage, {
        threadKey: key
      });
    } else {
      this.notify('Network not found..');
    }
  }

  reloadThreads(refresher) {
    this.queryText = '';
    if (this.internetConnected) {
      this.loadThreads(true);
      refresher.complete();
    } else {
      refresher.complete();
    }
  }

  filterThreads(segment) {
    if (this.selectedSegment !== this.segment) {
      this.selectedSegment = this.segment;
      if (this.selectedSegment === 'favorites')
        this.queryText = '';
      if (this.internetConnected)
        // Initialize
        this.loadThreads(true);
    } else {
      this.scrollToTop();
    }
  }


  fetchNextThreads(infiniteScroll) {
    if (this.start > 0 && this.internetConnected) {
      this.loadThreads(false);
      infiniteScroll.complete();
    } else {
      infiniteScroll.complete();
    }
  }

  scrollToTop() {
    var self = this;
    setTimeout(function () {
      self.content.scrollToTop();
    }, 1500);
  }

  notify(message: string) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'top'
    });
    toast.present();
  }
}
