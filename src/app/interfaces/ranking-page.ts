import { RankedShooter } from "./shooter";

export interface RankingPage {
    weapon: string;
    distance: string;
    category: string;
    rows: RankedShooter[]; // tranche affichée
    groupSize: number; // nb total de tireurs dans la discipline
    pageNumberInGroup: number; // numéro de page dans la discipline (1..pageCountInGroup)
    pageCountInGroup: number; // nb de pages pour la discipline
}