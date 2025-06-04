export interface CategoryGroup {
	shooterDistance: any;
	shooterWeapon: any;
	shooterCategory: any;
	scoreSerie1: number | null;
	scoreSerie2: number | null;
	scoreSerie3: number | null;
	scoreSerie4: number | null;
	scoreSerie5: number | null;
	scoreSerie6: number | null;
	isSeniorOrDame: boolean;

	// autorise l'accès dynamique avec une string
	[key: string]: any;
}
