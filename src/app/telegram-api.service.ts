import { Injectable } from '@angular/core';
import { telegramConfig } from './telegram.config';

const MTProto = require('@mtproto/core/envs/browser');

@Injectable({
  providedIn: 'root'
})
export class TelegramApiService {

  public config = telegramConfig;
  public mtProto: any;

  constructor() {
    this.mtProto = new MTProto({
      api_id: this.config.api_id,
      api_hash: this.config.api_hash,
      test: false,
    });
  }

  // @ts-ignore
  public async call(method, params = {}, options = {}): Promise<any> {
    try {
      return await this.mtProto.call(method, params, options);
    } catch (error: any) {
      console.log(`${method} error:`, error);

      const { error_code, error_message } = error;

      if (error_code === 303) {
        const [type, dcIdAsString] = error_message.split('_MIGRATE_');

        const dcId = Number(dcIdAsString);

        // If auth.sendCode call on incorrect DC need change default DC, because
        // call auth.signIn on incorrect DC return PHONE_CODE_EXPIRED error
        if (type === 'PHONE') {
          await this.mtProto.setDefaultDc(dcId);
        } else {
          Object.assign(options, { dcId });
        }
        
        // this.mtProto.updates.on('updates', (updateInfo: any) => {
        //   console.log('updates:', updateInfo);
        // });

        return this.call(method, params, options);
      }

      return Promise.reject(error);
    }
  }

  // @ts-ignore
  public sendCode(phone): Promise<any> {
    // console.log(this.mtProto);
    return this.call(
      'auth.sendCode',
      {
        phone_number: phone,
        settings: {
          _: 'codeSettings',
        },
      }
    );
  }

  // @ts-ignore
  public signIn({ phone_code, phone_number, phone_code_hash }): Promise<any> {
    return this.call(
      'auth.signIn',
      {
        phone_code,
        phone_number,
        phone_code_hash,
      }
    );
  }

  public async getHistory(username: string): Promise<any> {
    console.log(`Fetch history messages of: ${username}`);

    const resolveGroup = await this.call(
      'contacts.resolveUsername',
      {
        username: username.replace('@', ''),
      }
    );
    console.log(resolveGroup);
    const hash = resolveGroup.chats[0].access_hash;
    const id = resolveGroup.chats[0].id;

    return (await this.call(
      'messages.getHistory',
      {
        peer: {
          _: 'inputPeerChannel',
          channel_id: id,
          access_hash: hash,
        },
        max_id: 0,
        offset: 0,
        limit: 10,
      }
    )).messages;
  }
}
