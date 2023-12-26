import { Component } from '@angular/core';
interface Category {
  cname: string;
  code: string;
}

@Component({
  selector: 'app-creation',
  templateUrl: './creation.component.html',
  styleUrls: ['./creation.component.scss']
})
export class CreationComponent {
  constructor() {
    this.shooterCategoryName = { cname: '', code: '' };
  }
  shooterFirstName: string = "";
  shooterLastName: string = "";
  shooterCompetitionName: string = "";
  shooterCategoryName: Category;
  isSeniorOrDameCategory: boolean = false;
  shooterClubName: string = "";
  scoreSerie1: number = 0;
  scoreSerie2: number = 0;
  scoreSerie3: number = 0;
  scoreSerie4: number = 0;
  scoreSerie5: number = 0;
  scoreSerie6: number = 0;

  competitionDate: string = "";
  competitionName: string = "";
  prixInscription: number = 0;
  prixCategSup: number = 0;

  clubName: string = "";

  categories: any[] = [
    {
      "name": "10 Mètres",
      "cname": "10 Mètres",
      "code": "10M",
      "categories": [
        {
          "name": "Pistolet",
          "cname": "Pistolet",
          "code": "PIS",
          "divisions": [
            {
              "name": "Homme",
              "cname": "Homme",
              "code": "H",
              "ages": [
                { "cname": "Poussin", "code": "10M-PIS-POU-G" },
                { "cname": "Minime", "code": "10M-PIS-MIN-G" },
                { "cname": "Benjamin", "code": "10M-PIS-BEN-G" },
                { "cname": "Cadet", "code": "10M-PIS-CAD-G" },
                { "cname": "Junior", "code": "10M-PIS-JUN-G" },
                { "cname": "Senior 1", "code": "10M-PIS-SEN1" },
                { "cname": "Senior 2", "code": "10M-PIS-SEN2" },
                { "cname": "Senior 3", "code": "10M-PIS-SEN3" }
              ]
            },
            {
              "name": "Femme",
              "cname": "Femme",
              "code": "F",
              "ages": [
                { "cname": "Poussin", "code": "10M-PIS-POU-F" },
                { "cname": "Minime", "code": "10M-PIS-MIN-F" },
                { "cname": "Benjamin", "code": "10M-PIS-BEN-F" },
                { "cname": "Cadet", "code": "10M-PIS-CAD-F" },
                { "cname": "Junior", "code": "10M-PIS-JUN-F" },
                { "cname": "Dame 1", "code": "10M-PIS-DAM1" },
                { "cname": "Dame 2", "code": "10M-PIS-DAM2" },
                { "cname": "Dame 3", "code": "10M-PIS-DAM3" }
              ]
            }
          ]
        },
        {
          "name": "Carabine",
          "cname": "Carabine",
          "code": "CAR",
          "divisions": [
            {
              "name": "Homme",
              "cname": "Homme",
              "code": "H",
              "ages": [
                { "cname": "Poussin", "code": "10M-CAR-POU-G" },
                { "cname": "Minime", "code": "10M-CAR-MIN-G" },
                { "cname": "Benjamin", "code": "10M-CAR-BEN-G" },
                { "cname": "Cadet", "code": "10M-CAR-CAD-G" },
                { "cname": "Junior", "code": "10M-CAR-JUN-G" },
                { "cname": "Senior 1", "code": "10M-CAR-SEN1" },
                { "cname": "Senior 2", "code": "10M-CAR-SEN2" },
                { "cname": "Senior 3", "code": "10M-CAR-SEN3" }
              ]
            },
            {
              "name": "Femme",
              "cname": "Femme",
              "code": "F",
              "ages": [
                { "cname": "Poussin", "code": "10M-CAR-POU-F" },
                { "cname": "Minime", "code": "10M-CAR-MIN-F" },
                { "cname": "Benjamin", "code": "10M-CAR-BEN-F" },
                { "cname": "Cadet", "code": "10M-CAR-CAD-F" },
                { "cname": "Junior", "code": "10M-CAR-JUN-F" },
                { "cname": "Dame 1", "code": "10M-CAR-DAM1" },
                { "cname": "Dame 2", "code": "10M-CAR-DAM2" },
                { "cname": "Dame 3", "code": "10M-CAR-DAM3" }
              ]
            }
          ]
        },
        {
          "name": "Arbalète",
          "cname": "Arbalète",
          "code": "ARB",
          "divisions": [
            {
              "name": "Homme",
              "cname": "Homme",
              "code": "H",
              "ages": [
                { "cname": "Poussin", "code": "10M-ARB-POU-G" },
                { "cname": "Minime", "code": "10M-ARB-MIN-G" },
                { "cname": "Benjamin", "code": "10M-ARB-BEN-G" },
                { "cname": "Cadet", "code": "10M-ARB-CAD-G" },
                { "cname": "Junior", "code": "10M-ARB-JUN-G" },
                { "cname": "Senior 1", "code": "10M-ARB-SEN1" },
                { "cname": "Senior 2", "code": "10M-ARB-SEN2" },
                { "cname": "Senior 3", "code": "10M-ARB-SEN3" }
              ]
            },
            {
              "name": "Femme",
              "cname": "Femme",
              "code": "F",
              "ages": [
                { "cname": "Poussin", "code": "10M-ARB-POU-F" },
                { "cname": "Minime", "code": "10M-ARB-MIN-F" },
                { "cname": "Benjamin", "code": "10M-ARB-BEN-F" },
                { "cname": "Cadet", "code": "10M-ARB-CAD-F" },
                { "cname": "Junior", "code": "10M-ARB-JUN-F" },
                { "cname": "Dame 1", "code": "10M-ARB-DAM1" },
                { "cname": "Dame 2", "code": "10M-ARB-DAM2" },
                { "cname": "Dame 3", "code": "10M-ARB-DAM3" }
              ]
            }
          ]
        },
        {
          "name": "Pistolet Vitesse",
          "cname": "Pistolet Vitesse",
          "code": "PV",
          "divisions": [
            {
              "name": "Homme",
              "cname": "Homme",
              "code": "H",
              "ages": [
                { "cname": "Poussin", "code": "10M-PV-POU-G" },
                { "cname": "Minime", "code": "10M-PV-MIN-G" },
                { "cname": "Benjamin", "code": "10M-PV-BEN-G" },
                { "cname": "Cadet", "code": "10M-PV-CAD-G" },
                { "cname": "Junior", "code": "10M-PV-JUN-G" },
                { "cname": "Senior 1", "code": "10M-PV-SEN1" },
                { "cname": "Senior 2", "code": "10M-PV-SEN2" },
                { "cname": "Senior 3", "code": "10M-PV-SEN3" }
              ]
            },
            {
              "name": "Femme",
              "cname": "Femme",
              "code": "F",
              "ages": [
                { "cname": "Poussin", "code": "10M-PV-POU-F" },
                { "cname": "Minime", "code": "10M-PV-MIN-F" },
                { "cname": "Benjamin", "code": "10M-PV-BEN-F" },
                { "cname": "Cadet", "code": "10M-PV-CAD-F" },
                { "cname": "Junior", "code": "10M-PV-JUN-F" },
                { "cname": "Dame 1", "code": "10M-PV-DAM1" },
                { "cname": "Dame 2", "code": "10M-PV-DAM2" },
                { "cname": "Dame 3", "code": "10M-PV-DAM3" }
              ]
            }
          ]
        },
        {
          "name": "Pistolet Percussion",
          "cname": "Pistolet Percussion",
          "code": "PP",
          "divisions": [
            {
              "name": "Homme",
              "cname": "Homme",
              "code": "H",
              "ages": [
                { "cname": "Poussin", "code": "10M-PP-POU-G" },
                { "cname": "Minime", "code": "10M-PP-MIN-G" },
                { "cname": "Benjamin", "code": "10M-PP-BEN-G" },
                { "cname": "Cadet", "code": "10M-PP-CAD-G" },
                { "cname": "Junior", "code": "10M-PP-JUN-G" },
                { "cname": "Senior 1", "code": "10M-PP-SEN1" },
                { "cname": "Senior 2", "code": "10M-PP-SEN2" },
                { "cname": "Senior 3", "code": "10M-PP-SEN3" }
              ]
            },
            {
              "name": "Femme",
              "cname": "Femme",
              "code": "F",
              "ages": [
                { "cname": "Poussin", "code": "10M-PP-POU-F" },
                { "cname": "Minime", "code": "10M-PP-MIN-F" },
                { "cname": "Benjamin", "code": "10M-PP-BEN-F" },
                { "cname": "Cadet", "code": "10M-PP-CAD-F" },
                { "cname": "Junior", "code": "10M-PP-JUN-F" },
                { "cname": "Dame 1", "code": "10M-PP-DAM1" },
                { "cname": "Dame 2", "code": "10M-PP-DAM2" },
                { "cname": "Dame 3", "code": "10M-PP-DAM3" }
              ]
            }
          ]
        }
      ]
    },
    {
      "name": "25 Mètres",
      "cname": "25 Mètres",
      "code": "25M",
      "categories": [
        {
          "name": "Pistolet",
          "cname": "Pistolet",
          "code": "PIS",
          "divisions": [
            {
              "name": "Homme",
              "cname": "Homme",
              "code": "H",
              "ages": [
                { "cname": "Poussin", "code": "25M-PIS-POU-G" },
                { "cname": "Minime", "code": "25M-PIS-MIN-G" },
                { "cname": "Benjamin", "code": "25M-PIS-BEN-G" },
                { "cname": "Cadet", "code": "25M-PIS-CAD-G" },
                { "cname": "Junior", "code": "25M-PIS-JUN-G" },
                { "cname": "Senior 1", "code": "25M-PIS-SEN1" },
                { "cname": "Senior 2", "code": "25M-PIS-SEN2" },
                { "cname": "Senior 3", "code": "25M-PIS-SEN3" }
              ]
            },
            {
              "name": "Femme",
              "cname": "Femme",
              "code": "F",
              "ages": [
                { "cname": "Poussin", "code": "25M-PIS-POU-F" },
                { "cname": "Minime", "code": "25M-PIS-MIN-F" },
                { "cname": "Benjamin", "code": "25M-PIS-BEN-F" },
                { "cname": "Cadet", "code": "25M-PIS-CAD-F" },
                { "cname": "Junior", "code": "25M-PIS-JUN-F" },
                { "cname": "Dame 1", "code": "25M-PIS-DAM1" },
                { "cname": "Dame 2", "code": "25M-PIS-DAM2" },
                { "cname": "Dame 3", "code": "25M-PIS-DAM3" }
              ]
            }
          ]
        },
        {
          "name": "Carabine",
          "cname": "Carabine",
          "code": "CAR",
          "divisions": [
            {
              "name": "Homme",
              "cname": "Homme",
              "code": "H",
              "ages": [
                { "cname": "Poussin", "code": "25M-CAR-POU-G" },
                { "cname": "Minime", "code": "25M-CAR-MIN-G" },
                { "cname": "Benjamin", "code": "25M-CAR-BEN-G" },
                { "cname": "Cadet", "code": "25M-CAR-CAD-G" },
                { "cname": "Junior", "code": "25M-CAR-JUN-G" },
                { "cname": "Senior 1", "code": "25M-CAR-SEN1" },
                { "cname": "Senior 2", "code": "25M-CAR-SEN2" },
                { "cname": "Senior 3", "code": "25M-CAR-SEN3" }
              ]
            },
            {
              "name": "Femme",
              "cname": "Femme",
              "code": "F",
              "ages": [
                { "cname": "Poussin", "code": "25M-CAR-POU-F" },
                { "cname": "Minime", "code": "25M-CAR-MIN-F" },
                { "cname": "Benjamin", "code": "25M-CAR-BEN-F" },
                { "cname": "Cadet", "code": "25M-CAR-CAD-F" },
                { "cname": "Junior", "code": "25M-CAR-JUN-F" },
                { "cname": "Dame 1", "code": "25M-CAR-DAM1" },
                { "cname": "Dame 2", "code": "25M-CAR-DAM2" },
                { "cname": "Dame 3", "code": "25M-CAR-DAM3" }
              ]
            }
          ]
        }
      ]
    },
    {
      "name": "50 Mètres",
      "cname": "50 Mètres",
      "code": "50M",
      "categories": [
        {
          "name": "Pistolet",
          "cname": "Pistolet",
          "code": "PIS",
          "divisions": [
            {
              "name": "Homme",
              "cname": "Homme",
              "code": "H",
              "ages": [
                { "cname": "Poussin", "code": "50M-PIS-POU-G" },
                { "cname": "Minime", "code": "50M-PIS-MIN-G" },
                { "cname": "Benjamin", "code": "50M-PIS-BEN-G" },
                { "cname": "Cadet", "code": "50M-PIS-CAD-G" },
                { "cname": "Junior", "code": "50M-PIS-JUN-G" },
                { "cname": "Senior 1", "code": "50M-PIS-SEN1" },
                { "cname": "Senior 2", "code": "50M-PIS-SEN2" },
                { "cname": "Senior 3", "code": "50M-PIS-SEN3" }
              ]
            },
            {
              "name": "Femme",
              "cname": "Femme",
              "code": "F",
              "ages": [
                { "cname": "Poussin", "code": "50M-PIS-POU-F" },
                { "cname": "Minime", "code": "50M-PIS-MIN-F" },
                { "cname": "Benjamin", "code": "50M-PIS-BEN-F" },
                { "cname": "Cadet", "code": "50M-PIS-CAD-F" },
                { "cname": "Junior", "code": "50M-PIS-JUN-F" },
                { "cname": "Dame 1", "code": "50M-PIS-DAM1" },
                { "cname": "Dame 2", "code": "50M-PIS-DAM2" },
                { "cname": "Dame 3", "code": "50M-PIS-DAM3" }
              ]
            }
          ]
        },
        {
          "name": "Carabine",
          "cname": "Carabine",
          "code": "CAR",
          "divisions": [
            {
              "name": "Homme",
              "cname": "Homme",
              "code": "H",
              "ages": [
                { "cname": "Poussin", "code": "50M-CAR-POU-G" },
                { "cname": "Minime", "code": "50M-CAR-MIN-G" },
                { "cname": "Benjamin", "code": "50M-CAR-BEN-G" },
                { "cname": "Cadet", "code": "50M-CAR-CAD-G" },
                { "cname": "Junior", "code": "50M-CAR-JUN-G" },
                { "cname": "Senior 1", "code": "50M-CAR-SEN1" },
                { "cname": "Senior 2", "code": "50M-CAR-SEN2" },
                { "cname": "Senior 3", "code": "50M-CAR-SEN3" }
              ]
            },
            {
              "name": "Femme",
              "cname": "Femme",
              "code": "F",
              "ages": [
                { "cname": "Poussin", "code": "50M-CAR-POU-F" },
                { "cname": "Minime", "code": "50M-CAR-MIN-F" },
                { "cname": "Benjamin", "code": "50M-CAR-BEN-F" },
                { "cname": "Cadet", "code": "50M-CAR-CAD-F" },
                { "cname": "Junior", "code": "50M-CAR-JUN-F" },
                { "cname": "Dame 1", "code": "50M-CAR-DAM1" },
                { "cname": "Dame 2", "code": "50M-CAR-DAM2" },
                { "cname": "Dame 3", "code": "50M-CAR-DAM3" }
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

  clubs: any[] = [
    { "name": "Club de Marennes" },
    { "name": "Club de Rochefort" },
    { "name": "Club de Pau" },
  ];
  filteredClubs: any[] = [];

  /**
  * Filtre les compétitions en fonction de la recherche de compétition entrée.
  * @param event - L'événement contenant la recherche de compétition entrée.
  */
  filterCompetition(event: any): void {
    const filtered: any[] = [];
    const query: string = event.query.toLowerCase();

    for (const competition of this.competitions) {
      if (competition.name.toLowerCase().includes(query)) {
        filtered.push(competition);
      }
    }

    this.filteredCompetitions = filtered;
  }

  /**
  * Filtre les clubs en fonction de la recherche du club entré.
  * @param event - L'événement contenant la recherche du club entré.
  */
  filterClub(event: any): void {
    const filtered: any[] = [];
    const query: string = event.query.toLowerCase();

    for (const club of this.clubs) {
      if (club.name.toLowerCase().includes(query)) {
        filtered.push(club);
      }
    }

    this.filteredClubs = filtered;
  }

  /**
  * Vérifie si la catégorie du tireur contient 'SEN' ou 'DAM' suivi d'un chiffre unique.
  */
  setIsSeniorOrDameCategory(): void {
    if (this.shooterCategoryName && this.shooterCategoryName.code) {
      const categoryCode = this.shooterCategoryName.code;
      this.isSeniorOrDameCategory = /SEN\d|DAM\d/.test(categoryCode);
    } else {
      this.isSeniorOrDameCategory = false;
    }
  }
}
