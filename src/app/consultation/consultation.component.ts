import { Component } from '@angular/core';

@Component({
  selector: 'app-consultation',
  templateUrl: './consultation.component.html',
  styleUrls: ['./consultation.component.scss']
})
export class ConsultationComponent {
  clubsTirSportif: any = {
    labels: ['Les Tireurs Rapides', 'Visée Parfaite', 'Les As du Pistolet'],
    datasets: [
        {
            data: [540, 325, 702],
        }
    ]
};
  options = {
    plugins: {
        legend: {
            labels: {
                usePointStyle: true,
                color: '#303030'
            }
        }
    }
};
}
