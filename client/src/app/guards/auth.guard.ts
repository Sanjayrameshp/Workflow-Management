import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserSevice } from '../services/user/user-sevice.service';
import { switchMap, of, catchError } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserSevice);
  const router = inject(Router);

  return userService.getUserObject().pipe( 
    switchMap((user: any) => {
      const role = user?.role;
      const authStatus = !!user;

      if (authStatus) {
        return of(true);
      } else {
        router.navigate(['/login']);
        return of(false);
      }
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};

export const adminGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserSevice);
  const router = inject(Router);

  return userService.getUserObject().pipe( 
    switchMap((user: any) => {
      const role = user?.role;
      const authStatus = !!user;

      if (authStatus && role === 'admin') {
        return of(true);
      } else {
        router.navigate(['/login']);
        return of(false);
      }
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};
