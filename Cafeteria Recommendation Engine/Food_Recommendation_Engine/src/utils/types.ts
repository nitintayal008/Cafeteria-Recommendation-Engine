
import { RowDataPacket } from "mysql2";

export interface User {
    id: number;
    name: string;
    employeeId: string;
    role: 'admin' | 'chef' | 'employee';
  }
  
  export interface LoginPayload {
    employeeId: string;
    name: string;
  }
  
  export interface MenuItemPayload {
    id?: number;
    name: string;
    price: number;
    mealType:string;
    availability: boolean;
  }
  
  export interface FeedbackPayload {
    itemId: number;
    comment: string;
    rating: number;
  }
  
  export interface MenuItem extends RowDataPacket {
    id: number;
    name: string;
    price: number;
    availability: boolean;
  }
