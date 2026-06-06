export {};

declare global {
	interface Window {
		electronAPI?: {
			isElectron: boolean;
			savePdf?: (fileName: string, data: ArrayBuffer) => Promise<string | null>;
			showItemInFolder?: (filePath: string) => Promise<void>;
		};
	}
}
