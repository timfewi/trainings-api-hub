// packages/frontend/src/app/services/instance.service.ts

import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import {
  ApiInstance,
  CreateInstanceRequest,
  InstanceResponse,
  ApiResponse,
} from '@trainings-api-hub/shared';
import { environment } from '../../environments/environment';

/**
 * Service for managing API instances
 */
@Injectable({
  providedIn: 'root',
})
export class InstanceService {
  private readonly http = inject(HttpClient);

  // Signals for reactive state management
  private readonly _instances = signal<InstanceResponse[]>([]);
  private readonly _currentInstance = signal<InstanceResponse | null>(null);
  private readonly _isLoading = signal(false);

  // Public readonly signals
  readonly instances = this._instances.asReadonly();
  readonly currentInstance = this._currentInstance.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  /**
   * Get all instances for the current user
   */
  getInstances(): Observable<ApiResponse<InstanceResponse[]>> {
    this._isLoading.set(true);

    return this.http
      .get<ApiResponse<InstanceResponse[]>>(`${environment.apiUrl}/instances`)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this._instances.set(response.data);

            // Set current instance if only one exists
            if (response.data.length === 1) {
              this._currentInstance.set(response.data[0]);
            }
          }
        }),
        catchError((error) => {
          console.error('Failed to fetch instances:', error);
          return throwError(() => error);
        }),
        tap(() => this._isLoading.set(false)),
      );
  }

  /**
   * Get specific instance by ID
   */
  getInstance(id: string): Observable<ApiResponse<InstanceResponse>> {
    this._isLoading.set(true);

    return this.http
      .get<
        ApiResponse<InstanceResponse>
      >(`${environment.apiUrl}/instances/${id}`)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this._currentInstance.set(response.data);

            // Update instance in the list
            const instances = this._instances();
            const index = instances.findIndex((inst) => inst.id === id);
            if (index >= 0) {
              const updatedInstances = [...instances];
              updatedInstances[index] = response.data;
              this._instances.set(updatedInstances);
            }
          }
        }),
        catchError((error) => {
          console.error('Failed to fetch instance:', error);
          return throwError(() => error);
        }),
        tap(() => this._isLoading.set(false)),
      );
  }

  /**
   * Create a new API instance
   */
  createInstance(
    request: CreateInstanceRequest = {},
  ): Observable<ApiResponse<InstanceResponse>> {
    this._isLoading.set(true);

    return this.http
      .post<
        ApiResponse<InstanceResponse>
      >(`${environment.apiUrl}/instances`, request)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Add new instance to the list
            const instances = this._instances();
            this._instances.set([...instances, response.data]);
            this._currentInstance.set(response.data);
          }
        }),
        catchError((error) => {
          console.error('Failed to create instance:', error);
          return throwError(() => error);
        }),
        tap(() => this._isLoading.set(false)),
      );
  }

  /**
   * Delete an API instance
   */
  deleteInstance(id: string): Observable<ApiResponse<void>> {
    this._isLoading.set(true);

    return this.http
      .delete<ApiResponse<void>>(`${environment.apiUrl}/instances/${id}`)
      .pipe(
        tap((response) => {
          if (response.success) {
            // Remove instance from the list
            const instances = this._instances();
            const updatedInstances = instances.filter((inst) => inst.id !== id);
            this._instances.set(updatedInstances);

            // Clear current instance if it was deleted
            const current = this._currentInstance();
            if (current && current.id === id) {
              this._currentInstance.set(null);
            }
          }
        }),
        catchError((error) => {
          console.error('Failed to delete instance:', error);
          return throwError(() => error);
        }),
        tap(() => this._isLoading.set(false)),
      );
  }

  /**
   * Set the current active instance
   */
  setCurrentInstance(instance: InstanceResponse): void {
    this._currentInstance.set(instance);
  }

  /**
   * Clear current instance
   */
  clearCurrentInstance(): void {
    this._currentInstance.set(null);
  }

  /**
   * Refresh instance status
   */
  refreshInstanceStatus(id: string): Observable<ApiResponse<InstanceResponse>> {
    return this.getInstance(id);
  }

  /**
   * Test instance connectivity
   */
  testInstance(instanceUrl: string): Observable<any> {
    return this.http.get(`${instanceUrl}/health`).pipe(
      catchError((error) => {
        console.error('Instance connectivity test failed:', error);
        return throwError(() => error);
      }),
    );
  }
}
