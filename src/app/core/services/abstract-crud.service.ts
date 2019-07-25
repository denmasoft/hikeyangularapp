import {AbstractApiBaseService} from './abstract-api-base.service';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {IEntity} from '../models/IEntity';
import {tap} from 'rxjs/operators';
import * as _ from 'lodash';

/**
 * Base class of all the services that are backing the data-operations (CRUD operations) of a certain domain entity
 * type.
 *
 * This services sends:
 *
 * - An HTTP GET request without arguments to obtain all the instances of TEntity there are in the backend.
 * - An HTTP GET request with an id of the single TEntity to fetch from the backend.
 * - An HTTP POST request with the field values of a new TEntity to store in the backend.
 * - An HTTP PUT request with the field values of a single TEntity to update in the backend.
 * - An HTTP DELETE request with the id of a single TEntity to delete from the backend.
 *
 * The model in the current context stands for the type of the domain type which instances are being managed by the
 * a derived class of this one. It can also be called resource in some comments.
 */
export abstract class AbstractCrudService<TEntity extends IEntity> extends AbstractApiBaseService {

    /**
     * Initializes a new instance of AbstractCrudService&lt;TEntity&gt; with required services.
     *
     * @param {HttpClient} http: A service to make requests to the backend.
     */
    constructor(http: HttpClient) {
        super(http);
    }


    /**
     * Gets all the elements of TEntity type from the backend by issuing an HTTP GET request to the model URL.
     *
     * @param {any[]} pipeline: An array of RxJS operators to handle the response and possibly transform it.
     * @returns {Observable<TEntity[]>} which will eventually return the collection of objects of TEntity type coming
     * from the backend.
     */
    public items(pipeline?: any[]): Observable<TEntity[]> {
        return super.get(this.getModelUrl(), false, pipeline);
    }

    /**
     * When overridden in a derived class it will returns the name of the model being managed. This name will be used to
     * form the base URL of the endpoint handling the operations for the model. For example: if there is model for a
     * Ball, this property should return 'ball' as value, with it, then in the other function of the current class the
     * URL used to make the HTTP requests will be <http|https>://<domain>:<port>/<api base uri>/ball.
     *
     * @returns {string} representing the name of the model with backend requests are managed by the current service.
     */
    protected abstract get modelName(): string;

    /**
     * When overridden in a derived class it return a new instance of TEntity.
     *
     * @returns {TEntity} being the newly created entity.
     */
    abstract get newEntity(): TEntity;


    /**
     * Fetches the single instance of type TEntity which id is the given one.
     * @param {number} id: The id of the entity to fetch its data.
     * @param {any[]} pipeline: An array of operators to apply to the resulting Observable of the request.
     * @returns {Observable<TEntity extends IEntity>} which eventually will bring the data of the fetched instance or
     * raise an error if non is found.
     */
    getInstance(id: any, pipeline = []): Observable<TEntity> {
        pipeline = this.createPipeline(pipeline);

        return this.http.get<TEntity>(this.getSpecificModelUrl(id), this.headers).pipe();
    }

    /**
     * Creates a new entity and commands to add to the backend by issuing the correct HTTP POST request.
     *
     * @param data: An object containing the initial data of the entity to create (can be null and it there will be used
     * the result of the property newEntity).
     * @param {any[]} pipeline: An array of operators to apply to the resulting Observable of the request.
     * @returns {Observable<TEntity extends IEntity>} which eventually will yield the new entity with data already
     * populated in the backend (important: it will already contain a generated id value).
     */
    createItem(data: TEntity | null = null, pipeline = []): Observable<TEntity> {
        data = data || this.newEntity;

        const newPipeline = [
            tap<TEntity>(entity => {
                console.debug('Added: ', entity);
            }),
            ...pipeline
        ];

        return super.post(this.getModelUrl(), data, false, newPipeline);
    }

    /**
     * Persists the changes made to the given entity.
     *
     * @param {TEntity} item: The entity to persist its changes.
     * @param {any[]} pipeline: An array of operators to apply to the resulting Observable of the request.
     * @returns {Observable<TEntity extends IEntity>} which eventually will yield the data of the updated entity
     * (maybe the backend changes something when processing the request, through this Observable those changes are
     * available).
     */
    updateItem(item: TEntity, pipeline = []): Observable<TEntity> {
        const url = this.getSpecificModelUrl(item);

        const newPipeline = [
            tap(() => {
                console.debug('Updated: ', item);
            }),
            ...pipeline
        ];

        return super.put(url, item, false, newPipeline);
    }

    /**
     * Deletes a given entity from the backend by issues an HTTP DELETE request.
     *
     * @param {TEntity} item: The entity to remove.
     * @param {any[]} pipeline: An array of operators to apply to the resulting Observable of the request.
     * @returns {Observable<any>} which allows to monitor the result and status of the request once issued.
     */
    deleteItem(item: TEntity, pipeline = []): Observable<any> {
        const url = this.getSpecificModelUrl(item);

        const newPipeline = [
            tap(() => {
                console.debug('Removed: ', item);
            }),
            ...pipeline
        ];

        return super.delete(url, false, newPipeline);
    }

    /**
     * Gets elements by search criteria of TEntity type from the backend by issuing an HTTP GET request to the model URL.
     *
     * @param params
     */
    public searchItems(params?: any): Observable<any> {
      const pipeline = this.createPipeline([]);

      return this.http.get<any>(this.getModelUrl(), this.getRequestOptions(params)).pipe();
    }

    public _searchItems(params?: any): Observable<any> {
        const pipeline = this.createPipeline([]);

        return this.http.post<any>(this.getModelUrl(), params, this.headers).pipe();
      }

    /**
     * Gets the URL of the endpoint to which all requests will be addressed.
     *
     * @returns {string} the URL of the resource endpoint.
     */
    protected getModelUrl(): string {
        return `${this.apiUrl}/${this.modelName}/`;
    }

    /**
     * Gets the model URL for a specific model instance.
     *
     * @param {TEntity | any} item: The instance to obtain its corresponding URL, or any other value being the id of the
     * instance.
     * @returns {string} representing the obtained URL.
     */
    protected getSpecificModelUrl(item: TEntity | string | number): string {
        item = (typeof item === 'string' || typeof item === 'number') ? item : item.id;

        return `${this.apiUrl}/${this.modelName}/${item}/`;
    }

    /**
     * @param params
     */
    private getRequestOptions(params: any) {
      return {
        headers: this.headers,
        params: this.getHttpParams(params),
      };
    }

    /**
     * @param params
     * @returns {HttpParams}
     */
    private getHttpParams(params: any): HttpParams {
      let httpParams = new HttpParams();
      _.forOwn(params, (value, key) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value);
        }
      });

      return httpParams;
    }
}
