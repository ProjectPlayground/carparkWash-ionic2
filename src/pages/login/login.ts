import { Component } from '@angular/core';
import * as firebase from 'firebase';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { UserModel } from '../user/user.model';
import { UserService } from '../user/user.service';
import { ValidationMessageService } from '../shared/validator/validation-message.service';
import { CarModel } from '../car/car.model';
import { CarParkModel } from '../car-park/car-park.model';
import { ProfileTypeEnum } from '../shared/profile-type.enum';
import {
  LoadingOptions,
  LoadingController,
  NavController,
  MenuController,
  ToastController,
  AlertController
} from 'ionic-angular';
import { ProfilePage } from '../profile/profile';
import { AbstractPage } from '../shared/abstract.page';
import { GlobalValidator } from '../shared/validator/global.validator';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage extends AbstractPage {

  userModel = new UserModel();
  carModel = new CarModel();
  carParkModel = new CarParkModel();
  password: string = '';
  confirmPassword: string = '';
  isOnLogin = true;

  profileTypeEnum = ProfileTypeEnum;
  loginForm: FormGroup;
  loginFormErrors = {
    email: '',
    password: '',
  };
  signUpForm: FormGroup;
  signUpFormErrors = {
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    address: '',
    phoneNumber: '',
    profile: '',
  };
  carForm: FormGroup;
  carFormErrors = {
    licencePlateNumber: '',
    brandModel: '',
    colour: ''
  };
  carParkForm: FormGroup;
  carParkFormErrors = {
    name: '',
    address: '',
    cardinalPart: '',
    area: '',
    //nbPlaces: ''
  };
  cleanerForm: FormGroup;
  cleanerFormErrors = {};

  private loadingOptions: LoadingOptions;

  constructor(public userService: UserService, public messageService: ValidationMessageService,
              public formBuilder: FormBuilder, public menuCtr: MenuController,
              public navCtrl: NavController, public loadingCtrl: LoadingController,
              public toastCtrl: ToastController, public alertCtrl: AlertController) {

    super(toastCtrl);
    this.userModel = new UserModel();
    this.userModel.profile = ProfileTypeEnum.client;
    this.buildForms();
    this.menuCtr.enable(false);
    this.loadingOptions = {
      content: 'Loading',
      spinner: 'crescent',
      showBackdrop: false
    };
  }

  ionViewWillEnter() {
    let loading = this.loadingCtrl.create(this.loadingOptions);
    loading.present();
    this.userService.isAuth()
      .then(isAuth => {
        loading.dismissAll();
        if (isAuth) {
          this.menuCtr.enable(true);
          this.navCtrl.setRoot(ProfilePage);
        } else {
          this.buildForms();
        }
      })
      .catch(err => {
        loading.dismissAll();
        console.error(err);
      });
  }

  ionViewWillLeave() {
    GlobalValidator.endSamePassword(this.signUpForm, 'signUp');
  }

  login() {
    if (this.isOnLogin) {
      let loading = this.loadingCtrl.create(this.loadingOptions);
      loading.present();
      this.userService.login(this.userModel, this.password).then(() => {
        loading.dismissAll();
        this.navCtrl.setRoot(ProfilePage);
        this.menuCtr.enable(true);
        this.showToast('Log in Success', 'toastInfo');
      }).catch(err => {
        loading.dismissAll();
        this.showToast(err.message, 'toastError');
      });
    } else {
      this.isOnLogin = true;
    }
  }

  loginFacebook() {
    console.log('loginFacebook');
    //let loading = this.loadingCtrl.create(this.loadingOptions);
    this.userService.facebookLogin().then((data) => {
      //loading.dismissAll();
      this.navCtrl.setRoot(ProfilePage);
      this.menuCtr.enable(true);
      this.showToast('Log in Success', 'toastInfo');
    }).catch((err: firebase.FirebaseError) => {
      //loading.dismissAll();
      console.error(err);
      let errMsg = 'Log in Fail';
      switch (err.code) {
        case 'auth/invalid-email':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errMsg = 'Incorrect email or password';
          break;
      }
      this.showToast(errMsg, 'toastError');
    });
  }

  signUp() {
    if (this.isOnLogin) {
      this.isOnLogin = false;
    } else {
      let loading = this.loadingCtrl.create(this.loadingOptions);
      loading.present();
      this.userService.create(this.userModel, this.password, this.carParkModel, this.carModel)
        .then(() => {
          loading.dismissAll();
          this.navCtrl.setRoot(ProfilePage);
          ;
          this.menuCtr.enable(true);
          this.showToast('Sign Up Success', 'toastInfo');
        })
        .catch((err: firebase.FirebaseError) => {
          loading.dismissAll();
          console.error(err);
          let errMsg = 'Sign Up Fail';

          switch (err.code) {
            case 'auth/email-already-in-use-but-not-verified':
              let alert = this.alertCtrl.create({
                title: err.message[0],
                message: err.message[1],
                buttons: [
                  {
                    text: 'Re-sent',
                    handler: () => {
                      let loading = this.loadingCtrl.create(this.loadingOptions);
                      loading.present();
                      this.userService.sentEmailVerification().then(() => {
                        loading.dismissAll();
                        this.showToast('Verification email sent', 'toastInfo');
                        this.isOnLogin = true;
                      }).catch(err => {
                        loading.dismissAll();
                        console.log(err);
                        this.showToast('Error Sending Verification email, please contact admin', 'toastError');
                      });
                    }
                  },
                  {
                    text: 'Cancel',
                    role: 'cancel'
                  }
                ]
              });
              alert.present();
              break;
            case 'auth/email-already-in-use':
              errMsg = err.message;
              break;
            case 'auth/network-request-failed':
              errMsg = 'No internet connection';
              break;
          }

          this.showToast(errMsg, 'toastError');
        });
    }
  }

  resetPassword() {
    this.userService.resetPassword(this.userModel).then(() => {
      this.showToast('Reset password email sent', 'toastInfo');
    }, (err) => {
      console.error(err);
      this.showToast(err.message, 'toastError');
    });
  }

  private buildForms() {
    this.buildLoginForm();
    this.buildSignUpForm();
    this.buildCarForm();
  }

  private buildCarForm() {
    this.carForm = this.formBuilder.group({
      licencePlateNumber: ['', Validators.compose([Validators.required,
        Validators.minLength(this.messageService.minLengthLicencePlateNumber),
        Validators.maxLength(this.messageService.maxLengthLicencePlateNumber)])],
      brandModel: ['', Validators.maxLength(this.messageService.maxLengthBrandModel)],
      colour: ['', Validators.maxLength(this.messageService.maxLengthCarColour)]
    });
    this.carForm.valueChanges.subscribe(data => {
      this.messageService.onValueChanged(this.carForm, this.carFormErrors);
    });
    this.messageService.onValueChanged(this.carForm, this.carFormErrors);
  }

  private buildSignUpForm() {
    this.signUpForm = this.formBuilder.group({
      email: ['', Validators.compose([Validators.required,
        GlobalValidator.mailFormat,
        Validators.maxLength(this.messageService.maxLengthEmail)])],
      name: ['', Validators.compose([Validators.required,
        Validators.minLength(this.messageService.minLengthName),
        Validators.maxLength(this.messageService.maxLengthName)])],
      password: ['', Validators.compose([Validators.required,
        Validators.minLength(this.messageService.minLengthPassword),
        Validators.maxLength(this.messageService.maxLengthPassword)])],
      confirmPassword: ['', Validators.required],
      address: ['', Validators.compose([Validators.required,
        Validators.minLength(this.messageService.minLengthAddress),
        Validators.maxLength(this.messageService.maxLengthAddress)])],
      phoneNumber: ['', Validators.pattern(/\(?([0-9]{3})?\)?([ .-]?)([0-9]{3})\2([0-9]{4})/)]
    });
    this.signUpForm.valueChanges.subscribe(data => {
      this.messageService.onValueChanged(this.signUpForm, this.signUpFormErrors);
    });
    this.messageService.onValueChanged(this.signUpForm, this.signUpFormErrors);
    setTimeout(GlobalValidator.samePassword(this.signUpForm, 'signUp'), 2000);
  }

  private buildLoginForm() {
    this.loginForm = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    });
    this.loginForm.valueChanges.subscribe(data => {
      this.messageService.onValueChanged(this.loginForm, this.loginFormErrors);
    });
    this.messageService.onValueChanged(this.loginForm, this.loginFormErrors);
  }
}