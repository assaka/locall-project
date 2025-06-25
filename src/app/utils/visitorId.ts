export function getVisitorId() {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('visitor_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('visitor_id', id);
  }
  return id;
} 