export interface Category {
  categoryId: string;
  name: string;
  description?: string;
  active: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  active?: boolean;
}

export interface UpdateCategoryInput {
  name: string;
  description?: string;
  active: boolean;
}