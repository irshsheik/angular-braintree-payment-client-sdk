import { Injectable } from '@angular/core';
import * as dropin from 'braintree-web-drop-in';
import { defer, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BraintreeService {
  dropInInstance: any;
  clientToken$ = this.httpClient.get<{ token: string }>(environment.braintree.client_token_url);

  constructor(
    private httpClient: HttpClient
  ) { }


  initiateDropInUI$ = this.clientToken$
    .pipe(
      map(result => this.getDropinConfig(result.token)),
      switchMap(config => this.generateUI$(config))
    )


  private generateUI$(config) {
    return defer(async () => {
      const instance = await dropin.create(config);
      return instance;
    }).pipe(
      tap(instance => this.dropInInstance = instance)
    );
  }

  requestPaymentMethodNonce$ = defer(async () => {
    const payload = await this.dropInInstance.requestPaymentMethod();
    return payload;
  });

  /**
   *  on constructor of this service, get the client token
   *  requestPaymentNonce$ using client token, provide the customer id also
   *  send the iniitiate payment to client
   *      provide nonce and device ddata amount calculated, cart-item ids, customer id, currency qar,
   *      coupon code
   *      
   * 
   * on server,
   * calculate amount from cart items quantity,
   * validate
   * take server one if not match
   * 
   *  
   */
  initiatePayment$ =
    this.requestPaymentMethodNonce$
      .pipe(
        switchMap((payload: { nonce: string, deviceData: string }) =>
          this.httpClient.post(
            environment.braintree.checkout_url,
            payload, {
            headers: new HttpHeaders({ 'content_type': 'application/json' })
          }
          )
        )
      );

  tearDown() {
    this.dropInInstance.teardown((r, e) => {
      console.log('teardown called', r, e);
    });
  }





  private getDropinConfig(token: string) {
    return {
      authorization: token,
      container: '#dropin-container',
      dataCollector: {
        kount: true // Required if Kount fraud data collection is enabled
      },
      card: {
        cardholderName: {
          required: true
        },
        overrides: {
          fields: {
            number: {
              maskInput: {
                showLastFour: true
              }
            },
            cvv: {
              maskInput: true
            }
          }
        }
      }
    }
  }

}
