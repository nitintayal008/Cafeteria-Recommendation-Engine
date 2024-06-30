
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

  export interface RatingComment extends RowDataPacket {
    menu_item_id: number;
    rating: number;
    comment: string;
}

export interface SentimentData extends RowDataPacket {
    menu_item_id: number;
    sentiment: string;
    average_rating: number;
    sentiment_score: number;
    date_calculated: Date;
}
