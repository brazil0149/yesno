import { NgModule, ErrorHandler } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { SocialSharing } from '@ionic-native/social-sharing';
import { MyApp } from './app.component';
import { SettingsPage } from '../pages/settings/settings';
import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';
import { LoginPage} from '../pages/login/login';
import { SignupPage } from '../pages/signup/signup';
import { ProfilePage } from '../pages/profile/profile';
import { EventCreatePage } from '../pages/event-create/event-create';
import { EventDetailPage } from '../pages/event-detail/event-detail';
import { CommentCreatePage } from '../pages/comment-create/comment-create'
import { ThreadCommentsPage } from '../pages/thread-comments/thread-comments';


// import components
import { ThreadComponent } from '../shared/components/thread.component';
import { UserAvatarComponent } from '../shared/components/user-avatar.component';
import { ShrinkingSegmentHeader } from '../components/shrinking-segment-header/shrinking-segment-header';
// Import providers
import { APP_PROVIDERS } from '../providers/app.providers'



@NgModule({
  declarations: [
    MyApp,
    EventCreatePage,
    CommentCreatePage,
    EventDetailPage,
    SettingsPage,
    HomePage,
    TabsPage,
    LoginPage,
    SignupPage,
    ProfilePage,
    ThreadCommentsPage,
    ThreadComponent,
    UserAvatarComponent,
    ShrinkingSegmentHeader,

  ],
  imports: [
    IonicModule.forRoot(MyApp),
    HttpModule,
    FormsModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    EventCreatePage,
    CommentCreatePage,
    EventDetailPage,
    SettingsPage,
    HomePage,
    TabsPage,
    LoginPage,
    SignupPage,
    ProfilePage,
    ThreadCommentsPage
  ],
  providers: [{provide: ErrorHandler, useClass: IonicErrorHandler}, APP_PROVIDERS,SocialSharing]
})
export class AppModule {}
