// Définition de l'interface pour la réponse de l'API de MailCheck.ai
export interface EmailValidityResponse {
	disposable: boolean;
	mx: boolean;
}
