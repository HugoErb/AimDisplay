import { Component } from '@angular/core';

interface AutoCompleteCompleteEvent {
  originalEvent: Event;
  query: string;
}

@Component({
  selector: 'app-creation',
  templateUrl: './creation.component.html',
  styleUrls: ['./creation.component.scss']
})
export class CreationComponent {
  firstName: string = "";
  lastName: string = "";
  competitionName: string = "";
  categoryName: string = "";
  clubName: string = "";
  scoreSerie1: number = 0;
  scoreSerie2: number = 0;
  scoreSerie3: number = 0;
  scoreSerie4: number = 0;
  scoreSerie5: number = 0;
  scoreSerie6: number = 0;

  categories: any[] = [
    {
      "name": "10 Mètres",
      "code": "10M",
      "categories": [
        {
          "name": "Pistolet",
          "code": "PIS",
          "divisions": [
            {
              "name": "Homme",
              "code": "H",
              "ages": [
                { "cname": "Benjamin", "code": "10M-PIS-H-BEN" },
                { "cname": "Cadet", "code": "10M-PIS-H-CAD" },
                { "cname": "Junior", "code": "10M-PIS-H-JUN" },
                { "cname": "Senior", "code": "10M-PIS-H-SEN" }
              ]
            },
            {
              "name": "Femme",
              "code": "F",
              "ages": [
                { "cname": "Benjamin", "code": "10M-PIS-F-BEN" },
                { "cname": "Cadet", "code": "10M-PIS-F-CAD" },
                { "cname": "Junior", "code": "10M-PIS-F-JUN" },
                { "cname": "Senior", "code": "10M-PIS-F-SEN" }
              ]
            }
          ]
        },
        {
          "name": "Carabine",
          "code": "CAR",
          "divisions": [
            {
              "name": "Homme",
              "code": "H",
              "ages": [
                { "cname": "Benjamin", "code": "10M-CAR-H-BEN" },
                { "cname": "Cadet", "code": "10M-CAR-H-CAD" },
                { "cname": "Junior", "code": "10M-CAR-H-JUN" },
                { "cname": "Senior", "code": "10M-CAR-H-SEN" }
              ]
            },
            {
              "name": "Femme",
              "code": "F",
              "ages": [
                { "cname": "Benjamin", "code": "10M-CAR-F-BEN" },
                { "cname": "Cadet", "code": "10M-CAR-F-CAD" },
                { "cname": "Junior", "code": "10M-CAR-F-JUN" },
                { "cname": "Senior", "code": "10M-CAR-F-SEN" }
              ]
            }
          ]
        }
      ]
    },
    {
      "name": "25 Mètres",
      "code": "25M",
      "categories": [
        {
          "name": "Pistolet",
          "code": "PIS",
          "divisions": [
            {
              "name": "Homme",
              "code": "H",
              "ages": [
                { "cname": "Benjamin", "code": "25M-PIS-H-BEN" },
                { "cname": "Cadet", "code": "25M-PIS-H-CAD" },
                { "cname": "Junior", "code": "25M-PIS-H-JUN" },
                { "cname": "Senior", "code": "25M-PIS-H-SEN" }
              ]
            },
            {
              "name": "Femme",
              "code": "F",
              "ages": [
                { "cname": "Benjamin", "code": "25M-PIS-F-BEN" },
                { "cname": "Cadet", "code": "25M-PIS-F-CAD" },
                { "cname": "Junior", "code": "25M-PIS-F-JUN" },
                { "cname": "Senior", "code": "25M-PIS-F-SEN" }
              ]
            }
          ]
        },
        {
          "name": "Carabine",
          "code": "CAR",
          "divisions": [
            {
              "name": "Homme",
              "code": "H",
              "ages": [
                { "cname": "Benjamin", "code": "25M-CAR-H-BEN" },
                { "cname": "Cadet", "code": "25M-CAR-H-CAD" },
                { "cname": "Junior", "code": "25M-CAR-H-JUN" },
                { "cname": "Senior", "code": "25M-CAR-H-SEN" }
              ]
            },
            {
              "name": "Femme",
              "code": "F",
              "ages": [
                { "cname": "Benjamin", "code": "25M-CAR-F-BEN" },
                { "cname": "Cadet", "code": "25M-CAR-F-CAD" },
                { "cname": "Junior", "code": "25M-CAR-F-JUN" },
                { "cname": "Senior", "code": "25M-CAR-F-SEN" }
              ]
            }
          ]
        }
      ]
    },
    {
      "name": "50 Mètres",
      "code": "50M",
      "categories": [
        {
          "name": "Pistolet",
          "code": "PIS",
          "divisions": [
            {
              "name": "Homme",
              "code": "H",
              "ages": [
                { "cname": "Benjamin", "code": "50M-PIS-H-BEN" },
                { "cname": "Cadet", "code": "50M-PIS-H-CAD" },
                { "cname": "Junior", "code": "50M-PIS-H-JUN" },
                { "cname": "Senior", "code": "50M-PIS-H-SEN" }
              ]
            },
            {
              "name": "Femme",
              "code": "F",
              "ages": [
                { "cname": "Benjamin", "code": "50M-PIS-F-BEN" },
                { "cname": "Cadet", "code": "50M-PIS-F-CAD" },
                { "cname": "Junior", "code": "50M-PIS-F-JUN" },
                { "cname": "Senior", "code": "50M-PIS-F-SEN" }
              ]
            }
          ]
        },
        {
          "name": "Carabine",
          "code": "CAR",
          "divisions": [
            {
              "name": "Homme",
              "code": "H",
              "ages": [
                { "cname": "Benjamin", "code": "50M-CAR-H-BEN" },
                { "cname": "Cadet", "code": "50M-CAR-H-CAD" },
                { "cname": "Junior", "code": "50M-CAR-H-JUN" },
                { "cname": "Senior", "code": "50M-CAR-H-SEN" }
              ]
            },
            {
              "name": "Femme",
              "code": "F",
              "ages": [
                { "cname": "Benjamin", "code": "50M-CAR-F-BEN" },
                { "cname": "Cadet", "code": "50M-CAR-F-CAD" },
                { "cname": "Junior", "code": "50M-CAR-F-JUN" },
                { "cname": "Senior", "code": "50M-CAR-F-SEN" }
              ]
            }
          ]
        }
      ]
    }
  ];

  competitions: any[] = [
    { "name": "Tournoi de Marennes" },
    { "name": "Tournoi de Rochefort" },
    { "name": "Tournoi de Pau" },
  ];
  filteredCompetitions: any[] = [];

  filterCompetition(event: AutoCompleteCompleteEvent) {
    let filtered: any[] = [];
    let query = event.query;

    for (let i = 0; i < (this.competitions as any[]).length; i++) {
      let country = (this.competitions as any[])[i];
      if (country.name.toLowerCase().indexOf(query.toLowerCase()) == 0) {
        filtered.push(country);
      }
    }

    this.filteredCompetitions = filtered;
  }

}
