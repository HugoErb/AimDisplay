import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, CanActivateChildFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> => {
	const router = inject(Router);
	const authService = inject(AuthService);

	if (state.url === '/splash-screen') return true;
	if (state.url.startsWith('/reset-password')) return true;

	const session = await authService.getCurrentSession?.();
	if (session) return true;

	return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
};

export const authGuardChild: CanActivateChildFn = async (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> => {
	const router = inject(Router);
	const authService = inject(AuthService);

	if (state.url.startsWith('/reset-password')) return true;

	const session = await authService.getCurrentSession?.();
	if (session) return true;

	return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
};
