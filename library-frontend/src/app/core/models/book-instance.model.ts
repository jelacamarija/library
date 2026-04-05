export interface BookInstanceDto {
  instanceID: number;
  inventoryNumber: string;
  status: string;
  location: string;

  publicationID: number;
  isbn: string;
  bookTitle: string;
  authors: string[];
}