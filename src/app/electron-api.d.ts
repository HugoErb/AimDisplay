export {};

declare global {
	interface Window {
		deeplink?: {
			on: (cb: (url: string) => void) => void;
			getInitial: () => Promise<string | null>;
			checkForUpdates?: () => Promise<{ status: string }>;
			applyUpdateNow?: () => Promise<string>;
			onUpdateStatus?: (cb: (status: string) => void) => void;
			onUpdateProgress?: (cb: (progress: number) => void) => void;
			rendererReady?: () => void;
		};
		display?: {
			openRanking: (competitionId: string, competitionName: string) => Promise<void>;
		};
		appInfo?: {
			getVersion: () => Promise<string>;
		};
		electronAPI?: {
			isElectron: boolean;
			savePdf?: (fileName: string, data: ArrayBuffer) => Promise<string | null>;
			showItemInFolder?: (filePath: string) => Promise<void>;
		};
	}
}
