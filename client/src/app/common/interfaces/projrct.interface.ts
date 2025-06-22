export interface Project {
  _id: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}