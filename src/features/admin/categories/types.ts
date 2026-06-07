export interface Category {
  categoryId: string;
  name: string;
  active: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface CreateCategoryInput {
  name: string;
  active?: boolean;
}

export interface UpdateCategoryInput {
  name: string;
  active: boolean;
}