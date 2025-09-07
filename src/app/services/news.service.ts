import { Injectable, inject } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface News {
  id?: string;
  title: string;
  content: string;
  imageUrl?: string;
  author: string;
  publishedAt: any; 
  updatedAt?: any;   
  isPublished?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private readonly newsCollection = 'news';
  private firestore = inject(AngularFirestore);

  /**
   * Get all published news, ordered by published date (newest first)
   * @returns Observable of news array
   */
  getNews(): Observable<News[]> {
    return this.firestore
      .collection<News>(
        this.newsCollection, 
        ref => ref.where('isPublished', '==', true)
                 .orderBy('publishedAt', 'desc')
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        map(news => news || []) // Ensure we always return an array
      );
  }

  /**
   * Get a single news article by ID
   * @param id News article ID
   * @returns Observable of news article or undefined if not found
   */
  getNewsById(id: string): Observable<News | undefined> {
    return this.firestore
      .doc<News>(`${this.newsCollection}/${id}`)
      .valueChanges()
      .pipe(
        map(news => news ? { ...news, id } as News : undefined)
      );
  }
}
