import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorkspaceRefreshService {
  private readonly updatesSubject = new Subject<void>();
  readonly updates$ = this.updatesSubject.asObservable();

  notify(): void {
    this.updatesSubject.next();
  }
}