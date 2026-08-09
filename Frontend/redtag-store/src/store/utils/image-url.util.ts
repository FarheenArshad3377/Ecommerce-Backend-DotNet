import { environment } from "../../environments/environment";

export function getImageUrl(path?: string | null): string {
  if (!path) return 'assets/no-image.png';
  if (path.startsWith('http')) return path;
  return `${environment.apiUrl}${path}`;
}