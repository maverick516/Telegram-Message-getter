import { Component } from '@angular/core';
import { Observable, Subject, switchMap } from 'rxjs';
import { TelegramApiService } from './telegram-api.service';

interface SignInParams {
  phone_code: string;
  phone_number: string;
  phone_code_hash: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: []
})

export class AppComponent {
  public signInParams = {} as SignInParams;
  public requestedChannel = new Subject<string>();

  public historyMessages$: Observable<any> = this.requestedChannel.pipe(
    switchMap((channel) => this.telegramApiService.getHistory(channel))
  );

  constructor(private telegramApiService: TelegramApiService) {

  }

  public async onSendPhoneNumber(phone: string): Promise<void> {
    this.signInParams.phone_number = phone;
    const { phone_code_hash } = await this.telegramApiService.sendCode(phone);
    this.signInParams.phone_code_hash = phone_code_hash;
  }

  public async onSignIn(code: string): Promise<void> {
    this.signInParams.phone_code = code;
    const signInResult = await this.telegramApiService.signIn(this.signInParams);
    console.log('-> signInResult', signInResult);
  }

  public getDateFromUnix(unix: any) {
    const date = new Date(unix * 1000);
    const hours = date.getHours();
    const minutes = '0' + date.getMinutes();
    const seconds = '0' + date.getSeconds();
    return hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
  }
}
