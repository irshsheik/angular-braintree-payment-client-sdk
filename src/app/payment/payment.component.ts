import { AfterViewInit, Component, OnInit } from '@angular/core';

import { BraintreeService } from './braintree.service';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit, AfterViewInit {
  paymentInProgress = false;
  success = false;
  fail = false;
  failMsg: string;


  constructor(
    private braintreeService: BraintreeService
  ) { }

  ngAfterViewInit(): void {
    this.braintreeService.initiateDropInUI$.subscribe(event => console.log('onRequestable', event));
  }

  ngOnInit(): void { }

  payNow() {
    this.paymentInProgress = true;
    this.braintreeService.initiatePayment$
      .subscribe(
        (payload: { result: any }) => {
          console.log('payload => ', payload);
          this.paymentInProgress = false;
          this.success = payload.result.success;
          if (payload.result.success) {
            this.success = true;
            this.braintreeService.tearDown();
          } else {
            this.fail = true;
            this.failMsg = payload.result.message;
          }

        },
        error => {
          console.log('error => ', error);
          this.paymentInProgress = false;
          this.success = false;
        }
      );
  }



}
