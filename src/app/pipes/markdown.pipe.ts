import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {
    // Configure marked options
    marked.setOptions({
      breaks: true,
      gfm: true
    });
  }

  transform(value: string): SafeHtml {
    if (!value) return '';
    
    try {
      // Convert markdown to HTML - use parse method for synchronous operation
      const html = marked.parse(value) as string;
      
      // Sanitize and return safe HTML
      return this.sanitizer.bypassSecurityTrustHtml(html);
    } catch (error) {
      console.error('Error parsing markdown:', error);
      // Return plain text if markdown parsing fails
      return this.sanitizer.bypassSecurityTrustHtml(value);
    }
  }
}