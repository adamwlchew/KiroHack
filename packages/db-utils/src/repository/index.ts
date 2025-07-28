/**
 * Repository base classes
 */

/**
 * Generic repository interface
 */
export interface Repository<T, K> {
  /**
   * Gets an item by its ID
   * 
   * @param id Item ID
   */
  getById(id: K): Promise<T | null | undefined>;
  
  /**
   * Gets all items
   */
  getAll(): Promise<T[]>;
  
  /**
   * Creates a new item
   * 
   * @param item Item to create
   */
  create(item: T): Promise<T>;
  
  /**
   * Updates an existing item
   * 
   * @param id Item ID
   * @param item Item data
   */
  update(id: K, item: Partial<T>): Promise<T | null | undefined>;
  
  /**
   * Deletes an item
   * 
   * @param id Item ID
   */
  delete(id: K): Promise<boolean | void>;
}

/**
 * Base repository implementation
 */
export abstract class BaseRepository<T, K> implements Repository<T, K> {
  /**
   * Gets an item by its ID
   * 
   * @param id Item ID
   */
  abstract getById(id: K): Promise<T | null | undefined>;
  
  /**
   * Gets all items
   */
  abstract getAll(): Promise<T[]>;
  
  /**
   * Creates a new item
   * 
   * @param item Item to create
   */
  abstract create(item: T): Promise<T>;
  
  /**
   * Updates an existing item
   * 
   * @param id Item ID
   * @param item Item data
   */
  abstract update(id: K, item: Partial<T>): Promise<T | null | undefined>;
  
  /**
   * Deletes an item
   * 
   * @param id Item ID
   */
  abstract delete(id: K): Promise<boolean | void>;
  
  /**
   * Finds items by a field value
   * 
   * @param field Field name
   * @param value Field value
   */
  abstract findBy(field: string, value: any): Promise<T[]>;
  
  /**
   * Finds one item by a field value
   * 
   * @param field Field name
   * @param value Field value
   */
  abstract findOneBy(field: string, value: any): Promise<T | null | undefined>;
}

/**
 * In-memory repository implementation for testing
 */
export class InMemoryRepository<T extends { id: K }, K = string> extends BaseRepository<T, K> {
  protected items: Map<K, T> = new Map();
  
  /**
   * Gets an item by its ID
   * 
   * @param id Item ID
   */
  async getById(id: K): Promise<T | null> {
    const item = this.items.get(id);
    return item || null;
  }
  
  /**
   * Gets all items
   */
  async getAll(): Promise<T[]> {
    return Array.from(this.items.values());
  }
  
  /**
   * Creates a new item
   * 
   * @param item Item to create
   */
  async create(item: T): Promise<T> {
    this.items.set(item.id, { ...item });
    return { ...item };
  }
  
  /**
   * Updates an existing item
   * 
   * @param id Item ID
   * @param updates Updates to apply
   */
  async update(id: K, updates: Partial<T>): Promise<T | null> {
    const existingItem = this.items.get(id);
    
    if (!existingItem) {
      return null;
    }
    
    const updatedItem = { ...existingItem, ...updates };
    this.items.set(id, updatedItem);
    
    return { ...updatedItem };
  }
  
  /**
   * Deletes an item
   * 
   * @param id Item ID
   */
  async delete(id: K): Promise<boolean> {
    return this.items.delete(id);
  }
  
  /**
   * Finds items by a field value
   * 
   * @param field Field name
   * @param value Field value
   */
  async findBy(field: string, value: any): Promise<T[]> {
    return Array.from(this.items.values()).filter(item => 
      (item as any)[field] === value
    );
  }
  
  /**
   * Finds one item by a field value
   * 
   * @param field Field name
   * @param value Field value
   */
  async findOneBy(field: string, value: any): Promise<T | null> {
    const items = await this.findBy(field, value);
    return items.length > 0 ? items[0] : null;
  }
  
  /**
   * Clears all items
   */
  async clear(): Promise<void> {
    this.items.clear();
  }
}