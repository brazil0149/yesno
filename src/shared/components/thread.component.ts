import { Component, EventEmitter, OnInit, OnDestroy, Input, Output } from '@angular/core';
import { NavController, ModalController, ToastController, Content, NavParams,Events } from 'ionic-angular';

import { IThread } from '../interfaces';
import { DataService } from '../services/data.service';
import { AuthService } from '../services/auth.service';
import { MappingsService } from '../services/mappings.service';
import { ItemsService} from '../services/items.service';
import { SocialSharing } from '@ionic-native/social-sharing';

@Component({
    selector: 'forum-thread',
    templateUrl: 'thread.component.html'
})
export class ThreadComponent implements OnInit, OnDestroy {
    @Input() thread: IThread;
    @Output() onViewComments = new EventEmitter<string>();
    total: IThread[];
    threadKey: string;
    message:	string;

    constructor(private dataService: DataService,public authService: AuthService,
    public itemsService: ItemsService,
    public mappingsService: MappingsService,
    public modalCtrl: ModalController,
    public toastCtrl: ToastController,
    public navParams: NavParams,private socialSharing: SocialSharing) { }

    ngOnInit() {
        var self = this;
        self.dataService.getThreadsRef().child(self.thread.key).on('child_changed', self.onCommentAdded);
        self.threadKey = self.navParams.get('threadKey');
    }

    ngOnDestroy() {
         console.log('destroying..');
        var self = this;
        self.dataService.getThreadsRef().child(self.thread.key).off('child_changed', self.onCommentAdded);
    }

    // Notice function declarion to keep the right this reference
    public onCommentAdded = (childSnapshot, prevChildKey) => {
       console.log(childSnapshot.val());
        var self = this;
        // Attention: only number of comments is supposed to changed.
        // Otherwise you should run some checks..
        self.thread.comments = childSnapshot.val();
    }

    viewComments(key: string) {
        this.onViewComments.emit(key);
    }

    vote(like: boolean, votes: IThread) {
        var self = this;

        self.dataService.votePost(votes.key, like, self.authService.getLoggedInUser().uid).then(function () {
            self.dataService.getThreadsRef().child(votes.key).once('value').then(function (snapshot) {
                votes = self.mappingsService.getThread(snapshot, votes.key);
                self.itemsService.setItem<IThread>(self.total, c => c.key === votes.key, votes);
            });
        });
    }

    removeItem(post) {
      var self = this;
      let currentUser = self.authService.getLoggedInUser();
      if (currentUser != null) {
        self.dataService.removePost(post)
            .then(function () {
                let toast = self.toastCtrl.create({
                    message: 'The post is deleted',
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

    sharePost(message: string) {
      this.socialSharing.shareWithOptions(message);
    }


}
