import { Component, OnInit, ViewChild } from '@angular/core';
import { ActionSheetController, ModalController, ToastController, LoadingController, NavParams, Content } from 'ionic-angular';

import { CommentCreatePage } from '../comment-create/comment-create';
import { IComment } from '../../shared/interfaces';
import { AuthService } from '../../shared/services/auth.service';
import { DataService } from '../../shared/services/data.service';
import { MappingsService } from '../../shared/services/mappings.service';
import { ItemsService} from '../../shared/services/items.service';

@Component({
    templateUrl: 'thread-comments.html'
})
export class ThreadCommentsPage implements OnInit {
    @ViewChild(Content) content: Content;
    threadKey: string;
    commentsLoaded: boolean = false;
    comments: IComment[];

    constructor(public actionSheeCtrl: ActionSheetController,
        public modalCtrl: ModalController,
        public toastCtrl: ToastController,
        public loadingCtrl: LoadingController,
        public navParams: NavParams,
        public authService: AuthService,
        public itemsService: ItemsService,
        public dataService: DataService,
        public mappingsService: MappingsService) { }

    ngOnInit() {
        var self = this;
        self.threadKey = self.navParams.get('threadKey');
        self.commentsLoaded = false;

        self.dataService.getThreadCommentsRef(self.threadKey).once('value', function (snapshot) {
            self.comments = self.mappingsService.getComments(snapshot);
            self.commentsLoaded = true;
        }, function (error) {});
    }

    createComment() {
        let self = this;

        let modalPage = this.modalCtrl.create(CommentCreatePage, {
            threadKey: this.threadKey
        });

        modalPage.onDidDismiss((commentData: any) => {
            if (commentData) {
                let commentVals = commentData.comment;
                let commentUser = commentData.user;

                let createdComment: IComment = {
                    key: commentVals.key,
                    thread: commentVals.thread,
                    text: commentVals.text,
                    user: commentUser,
                    dateCreated: commentVals.dateCreated,
                    votesUp: null,
                    votesDown: null
                };

                self.comments.push(createdComment);
                self.scrollToBottom();

                let toast = this.toastCtrl.create({
                    message: 'Comment created',
                    duration: 2000,
                    position: 'top'
                });
                toast.present();
            }
        });

        modalPage.present();
    }

    scrollToBottom() {
        this.content.scrollToBottom();
    }

    vote(like: boolean, comment: IComment) {
        var self = this;

        self.dataService.voteComment(comment.key, like, self.authService.getLoggedInUser().uid).then(function () {
            self.dataService.getCommentsRef().child(comment.key).once('value').then(function (snapshot) {
                comment = self.mappingsService.getComment(snapshot, comment.key);
                self.itemsService.setItem<IComment>(self.comments, c => c.key === comment.key, comment);
            });
        });
    }

}
