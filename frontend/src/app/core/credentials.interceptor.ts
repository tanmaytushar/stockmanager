import { HttpInterceptorFn } from '@angular/common/http';
import { API_BASE_URL } from './api.config';

export const credentialsInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(API_BASE_URL)) {
    return next(request);
  }

  let authenticatedRequest = request.clone({ withCredentials: true });
  const unsafeMethod = !['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase());
  const csrfToken = unsafeMethod ? readCookie('XSRF-TOKEN') : null;

  if (csrfToken) {
    authenticatedRequest = authenticatedRequest.clone({
      setHeaders: { 'X-XSRF-TOKEN': csrfToken },
    });
  }

  return next(authenticatedRequest);
};

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const prefix = `${name}=`;
  const cookie = document.cookie.split('; ').find((part) => part.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}
