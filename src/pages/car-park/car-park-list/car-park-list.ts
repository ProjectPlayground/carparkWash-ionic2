import { Component } from '@angular/core';
import { ToastController } from 'ionic-angular';
import { CarParkService } from '../car-park.service';
import { CarParkModel } from '../car-park.model';
import { CarService } from '../../car/car.service';
import { CarModel } from '../../car/car.model';
import { CarParkFilterModel } from '../car-park-filter/car-park-filter.model';
import { AbstractPage } from '../../shared/abstract.page';

@Component({
  selector: 'page-car-park-list',
  templateUrl: 'car-park-list.html',
})
export class CarParkListPage extends AbstractPage {

  selectedCar: CarModel;
  carParks: Array<CarParkModel>;
  configCarousel = {
    slidesPerView: 4,
    //slidesPerColumn: 3,
    spaceBetween: 30,
    //grabCursor: true,
    centeredSlides: false,
    //loop: true,
    //autoplay: 5000,
    //autoplayDisableOnInteraction: false,
    paginationClickable: true,
    pagination: '.swiper-pagination',
    nextButton: '.swiper-button-next',
    prevButton: '.swiper-button-prev',
  };


  constructor(public carParkService: CarParkService, public carService: CarService,
              public toastCtrl: ToastController) {

    super(toastCtrl);
    this.selectedCar = this.carService.selectedCar;
  }

  ngOnInit() {
    //if (!this.selectedCar) {
    //  this.router.navigate(['']);
    //} else {
    this.carParkService.getAll()
      .then(carParks => this.carParks = carParks)
      .catch(err => {
        console.log(err);
        this.showToast('Error getting Car parks, please contact admin', 'toastError');
      });
    //}
  }

  getCarParksFilter(carParkFilterModel: CarParkFilterModel) {
    this.carParkService.getByAreas(carParkFilterModel)
      .then(carParks => this.carParks = carParks)
      .catch(err => {
        console.log(err);
        this.showToast('Error getting Car parks, please contact admin', 'toastError');
      });
  }

}