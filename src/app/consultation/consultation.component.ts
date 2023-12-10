import { Component } from '@angular/core';

@Component({
  selector: 'app-consultation',
  templateUrl: './consultation.component.html',
  styleUrls: ['./consultation.component.scss']
})
export class ConsultationComponent {

  // Graphique en ligne du score moyen par série
  nbreParticipants: any = {
    labels: ['Challenge Rochefortais', 'Grand concours', 'Master', 'Championnat départemental', 'Championnat régional', 'Championnat de france'],
    datasets: [
      {
        label: 'Nombre de participants',
        data: [71, 81, 88, 81, 71, 69],
        fill: false,
        tension: 0.4
      }
    ]
  };

  optionsNbreParticipants = {
    maintainAspectRatio: false,
    responsive: true,
    aspectRatio: 0.6,
    plugins: {
      legend: {
        labels: {
          color: '#303030'
        }
      }
    },
    scales: {
      x: {
        grid: {
          drawBorder: false
        }
      },
      y: {
        grid: {
          drawBorder: false
        }
      }
    }
  };

  // Graphique en camembert du meilleur club
  clubsTirSportif: any = {
    labels: ['Les Tireurs Rapides', 'Visée Parfaite', 'Les As du Pistolet'],
    datasets: [
      {
        data: [540, 325, 702],
      }
    ]
  };

  optionClubsTirSportif = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          usePointStyle: true,
          color: '#303030'
        }
      }
    }
  };


  // Graphique en ligne du score moyen par série
  resultatsSeries: any = {
    labels: ['Série 1', 'Série 2', 'Série 3', 'Série 4', 'Série 5', 'Série 6'],
    datasets: [
      {
        label: 'Score moyen 6 séries',
        data: [71, 81, 88, 81, 71, 69],
        fill: false,
        tension: 0.4
      },
      {
        label: 'Score moyen 4 séries',
        data: [68, 75, 82, 87],
        fill: false,
        tension: 0.4
      }
    ]
  };

  optionsResultatsSeries = {
    maintainAspectRatio: false,
    responsive: true,
    aspectRatio: 0.6,
    plugins: {
      legend: {
        labels: {
          color: '#303030'
        }
      }
    },
    scales: {
      x: {

        grid: {
          drawBorder: false
        }
      },
      y: {

        grid: {
          drawBorder: false
        }
      }
    }
  };


}
