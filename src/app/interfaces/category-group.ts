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
	hasSixSeries: boolean;
	_open: boolean; // uniquement pour l’animation

	// autorise l'accès dynamique avec une string
	[key: string]: any;
}
